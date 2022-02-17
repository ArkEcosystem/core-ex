import { Services } from "@arkecosystem/core-kernel";
import { Application } from "@arkecosystem/core-kernel/distribution/application";
import { Container } from "@arkecosystem/core-kernel";
import { describe } from "@arkecosystem/core-test";
import {
	DeactivatedTransactionHandlerError,
	InvalidTransactionTypeError,
} from "../errors";
import {
	One,
	TransactionHandler,
	TransactionHandlerConstructor,
	Two,
} from "./index";
import { TransactionHandlerProvider } from "./handler-provider";
import { TransactionHandlerRegistry } from "./handler-registry";
import { ServiceProvider } from "../service-provider";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { TransactionSchema } from "@arkecosystem/crypto/distribution/transactions/types/schemas";
import ByteBuffer from "bytebuffer";

const NUMBER_OF_REGISTERED_CORE_HANDLERS = 10;
const NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE = 7; // TODO: Check if correct
const NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE = 9;

const TEST_TRANSACTION_TYPE = 100;
const DEPENDANT_TEST_TRANSACTION_TYPE = 101;
const { schemas } = Transactions;

abstract class TestTransaction extends Transactions.Transaction {
	public static type: number = TEST_TRANSACTION_TYPE;
	public static typeGroup: number = Enums.TransactionTypeGroup.Test;
	public static key: string = "test";

	deserialize(buf: ByteBuffer): void {}

	serialize(): ByteBuffer | undefined {
		return undefined;
	}

	public static getSchema(): TransactionSchema {
		return schemas.extend(schemas.transactionBaseSchema, {
			$id: "test",
		});
	}
}

abstract class TestWithDependencyTransaction extends Transactions.Transaction {
	public static type: number = DEPENDANT_TEST_TRANSACTION_TYPE;
	public static typeGroup: number = Enums.TransactionTypeGroup.Test;
	public static key: string = "test_with_dependency";

	deserialize(buf: ByteBuffer): void {}

	serialize(): ByteBuffer | undefined {
		return undefined;
	}

	public static getSchema(): TransactionSchema {
		return schemas.extend(schemas.transactionBaseSchema, {
			$id: "test_with_dependency",
		});
	}
}

class TestTransactionHandler extends TransactionHandler {
	dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
		return [];
	}

	walletAttributes(): ReadonlyArray<string> {
		return [];
	}

	getConstructor(): Transactions.TransactionConstructor {
		return TestTransaction;
	}

	async bootstrap(): Promise<void> {
		return;
	}

	async isActivated(): Promise<boolean> {
		return true;
	}

	async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

	async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}

class TestWithDependencyTransactionHandler extends TransactionHandler {
	dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
		return [TestTransactionHandler];
	}

	walletAttributes(): ReadonlyArray<string> {
		return [];
	}

	getConstructor(): Transactions.TransactionConstructor {
		return TestWithDependencyTransaction;
	}

	async bootstrap(): Promise<void> {
		return;
	}

	async isActivated(): Promise<boolean> {
		return true;
	}

	async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

	async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}

describe("Registry", ({ assert, afterAll, afterEach, beforeAll, beforeEach, it }) => {
	beforeEach((context) => {
		const app = new Application(new Container.Container());
		app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(null);
		app.bind(Container.Identifiers.ApplicationNamespace).toConstantValue("ark-unitnet");
		app.bind(Container.Identifiers.LogService).toConstantValue({});

		app.bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
			.to(Services.Attributes.AttributeSet)
			.inSingletonScope();
		app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue({});
		app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});
		app.bind(Container.Identifiers.WalletRepository).toConstantValue({});
		app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue({});

		app.bind(Container.Identifiers.TransactionHandler).to(One.TransferTransactionHandler);
		app.bind(Container.Identifiers.TransactionHandler).to(Two.TransferTransactionHandler);
		app.bind(Container.Identifiers.TransactionHandler).to(One.DelegateRegistrationTransactionHandler);
		app.bind(Container.Identifiers.TransactionHandler).to(Two.DelegateRegistrationTransactionHandler);
		app.bind(Container.Identifiers.TransactionHandler).to(One.VoteTransactionHandler);
		app.bind(Container.Identifiers.TransactionHandler).to(Two.VoteTransactionHandler);
		app.bind(Container.Identifiers.TransactionHandler).to(One.MultiSignatureRegistrationTransactionHandler);
		app.bind(Container.Identifiers.TransactionHandler).to(Two.MultiSignatureRegistrationTransactionHandler);
		app.bind(Container.Identifiers.TransactionHandler).to(Two.MultiPaymentTransactionHandler);
		app.bind(Container.Identifiers.TransactionHandler).to(Two.DelegateResignationTransactionHandler);

		app.bind(Container.Identifiers.TransactionHandlerProvider).to(TransactionHandlerProvider).inSingletonScope();
		app.bind(Container.Identifiers.TransactionHandlerRegistry).to(TransactionHandlerRegistry).inSingletonScope();
		app.bind(Container.Identifiers.TransactionHandlerConstructors).toDynamicValue(
			ServiceProvider.getTransactionHandlerConstructorsBinding(),
		);

		context.app = app;

		Managers.configManager.getMilestone().aip11 = false;
	});

	afterEach(() => {
		try {
			Transactions.TransactionRegistry.deregisterTransactionType(TestTransaction);
		} catch {}
	});


	it("should register core transaction types", async (context) => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		await assert.resolves(() =>
			Promise.all([
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Transactions.InternalTransactionType.from(
						Enums.TransactionType.Transfer,
						Enums.TransactionTypeGroup.Core,
					),
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Transactions.InternalTransactionType.from(
						Enums.TransactionType.Transfer,
						Enums.TransactionTypeGroup.Core,
					),
					2,
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Transactions.InternalTransactionType.from(
						Enums.TransactionType.DelegateRegistration,
						Enums.TransactionTypeGroup.Core,
					),
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Transactions.InternalTransactionType.from(
						Enums.TransactionType.DelegateRegistration,
						Enums.TransactionTypeGroup.Core,
					),
					2,
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Transactions.InternalTransactionType.from(
						Enums.TransactionType.Vote,
						Enums.TransactionTypeGroup.Core,
					),
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Transactions.InternalTransactionType.from(
						Enums.TransactionType.Vote,
						Enums.TransactionTypeGroup.Core,
					),
					2,
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Transactions.InternalTransactionType.from(
						Enums.TransactionType.MultiSignature,
						Enums.TransactionTypeGroup.Core,
					),
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Transactions.InternalTransactionType.from(
						Enums.TransactionType.MultiSignature,
						Enums.TransactionTypeGroup.Core,
					),
					2,
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Transactions.InternalTransactionType.from(
						Enums.TransactionType.MultiPayment,
						Enums.TransactionTypeGroup.Core,
					),
					2,
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Transactions.InternalTransactionType.from(
						Enums.TransactionType.DelegateRegistration,
						Enums.TransactionTypeGroup.Core,
					),
					2,
				),
			]),
		);
	});

	it("should skip handler registration if provider handlerProvider is already registered", async (context) => {
		const transactionHandlerProvider = context.app.get<TransactionHandlerProvider>(Container.Identifiers.TransactionHandlerProvider);

		transactionHandlerProvider.isRegistrationRequired = jest.fn().mockReturnValue(false);
		transactionHandlerProvider.registerHandlers = jest.fn();

		context.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry);

		expect(transactionHandlerProvider.registerHandlers).not.toHaveBeenCalled();
	});

	it("should register a custom type", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);

		expect(() => {
			context.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry);
		}).not.toThrowError();
	});

	it("should register a custom type with dependency", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestWithDependencyTransactionHandler);

		expect(() => {
			context.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry);
		}).not.toThrowError();
	});

	it("should register a custom type with missing dependency", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestWithDependencyTransactionHandler);

		expect(() => {
			context.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry);
		}).toThrowError();
	});

	it("should be able to return handler by data", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		const keys = Identities.Keys.fromPassphrase("secret");
		const data: Interfaces.ITransactionData = {
			version: 1,
			typeGroup: Enums.TransactionTypeGroup.Test,
			type: TEST_TRANSACTION_TYPE,
			nonce: Utils.BigNumber.ONE,
			timestamp: Crypto.Slots.getTime(),
			senderPublicKey: keys.publicKey,
			fee: Utils.BigNumber.make("10000000"),
			amount: Utils.BigNumber.make("200000000"),
			recipientId: "APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq",
			asset: {
				test: 256,
			},
		};

		expect(await transactionHandlerRegistry.getActivatedHandlerForData(data)).toBeInstanceOf(
			TestTransactionHandler,
		);
	});

	it("should throw when registering the same key twice", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);

		expect(() => {
			context.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry);
		}).toThrow();
	});

	it("should return all registered core handlers", async (context) => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		expect(transactionHandlerRegistry.getRegisteredHandlers().length).toBe(NUMBER_OF_REGISTERED_CORE_HANDLERS);
	});

	it("should return all registered core and custom handlers", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		expect(transactionHandlerRegistry.getRegisteredHandlers().length).toBe(NUMBER_OF_REGISTERED_CORE_HANDLERS + 1);
	});

	it("should return all active core handlers", async (context) => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		expect((await transactionHandlerRegistry.getActivatedHandlers()).length).toBe(
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE,
		);

		Managers.configManager.getMilestone().aip11 = true;
		expect((await transactionHandlerRegistry.getActivatedHandlers()).length).toBe(
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE,
		);
	});

	it("should return all active core and custom handlers", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		expect((await transactionHandlerRegistry.getActivatedHandlers()).length).toBe(
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE + 1,
		);

		Managers.configManager.getMilestone().aip11 = true;
		expect((await transactionHandlerRegistry.getActivatedHandlers()).length).toBe(
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE + 1,
		);
	});

	it("should return a registered custom handler", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		const internalTransactionType = Transactions.InternalTransactionType.from(
			TEST_TRANSACTION_TYPE,
			Enums.TransactionTypeGroup.Test,
		);
		expect(transactionHandlerRegistry.getRegisteredHandlerByType(internalTransactionType)).toBeInstanceOf(
			TestTransactionHandler,
		);

		const invalidInternalTransactionType = Transactions.InternalTransactionType.from(
			999,
			Enums.TransactionTypeGroup.Test,
		);

		expect(() => {
			transactionHandlerRegistry.getRegisteredHandlerByType(invalidInternalTransactionType);
		}).toThrow(InvalidTransactionTypeError);
	});

	it("should return a activated custom handler", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		const internalTransactionType = Transactions.InternalTransactionType.from(
			TEST_TRANSACTION_TYPE,
			Enums.TransactionTypeGroup.Test,
		);
		expect(await transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType)).toBeInstanceOf(
			TestTransactionHandler,
		);

		const invalidInternalTransactionType = Transactions.InternalTransactionType.from(
			999,
			Enums.TransactionTypeGroup.Test,
		);
		await expect(
			transactionHandlerRegistry.getActivatedHandlerByType(invalidInternalTransactionType),
		).rejects.toThrow(InvalidTransactionTypeError);
	});

	it("should not return deactivated custom handler", async (context) => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);
		const internalTransactionType = Transactions.InternalTransactionType.from(
			Enums.TransactionType.DelegateResignation,
			Enums.TransactionTypeGroup.Core,
		);

		Managers.configManager.getMilestone().aip11 = false;
		await expect(transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType, 2)).rejects.toThrow(
			DeactivatedTransactionHandlerError,
		);

		Managers.configManager.getMilestone().aip11 = true;
		expect(await transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType, 2)).toBeInstanceOf(
			Two.DelegateResignationTransactionHandler,
		);
	});
});
