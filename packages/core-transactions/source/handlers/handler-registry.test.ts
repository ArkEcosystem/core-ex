import { Application, Container, Services } from "@arkecosystem/core-kernel";
import { describe } from "@arkecosystem/core-test-framework";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";

import { ServiceProvider } from "../service-provider";
import { TransactionHandlerProvider } from "./handler-provider";
import { TransactionHandlerRegistry } from "./handler-registry";
import { One, TransactionHandler, TransactionHandlerConstructor, Two } from "./index";

const NUMBER_OF_REGISTERED_CORE_HANDLERS = 10;
const NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE = 7; // TODO: Check if correct
const NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE = 9;

const TEST_TRANSACTION_TYPE = 100;
const DEPENDANT_TEST_TRANSACTION_TYPE = 101;
const { schemas } = Transactions;

abstract class TestTransaction extends Transactions.Transaction {
	public static type: number = TEST_TRANSACTION_TYPE;
	public static typeGroup: number = Enums.TransactionTypeGroup.Test;
	public static key = "test";

	deserialize(buf: ByteBuffer): void {}

	serialize(): ByteBuffer | undefined {
		return undefined;
	}

	public static getSchema(): Transactions.schemas.TransactionSchema {
		return schemas.extend(schemas.transactionBaseSchema, {
			$id: "test",
		});
	}
}

abstract class TestWithDependencyTransaction extends Transactions.Transaction {
	public static type: number = DEPENDANT_TEST_TRANSACTION_TYPE;
	public static typeGroup: number = Enums.TransactionTypeGroup.Test;
	public static key = "test_with_dependency";

	deserialize(buf: ByteBuffer): void {}

	serialize(): ByteBuffer | undefined {
		return undefined;
	}

	public static getSchema(): Transactions.schemas.TransactionSchema {
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

describe("Registry", ({ assert, afterEach, beforeEach, it, stub }) => {
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
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
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
		const transactionHandlerProvider = context.app.get<TransactionHandlerProvider>(
			Container.Identifiers.TransactionHandlerProvider,
		);

		transactionHandlerProvider.isRegistrationRequired = () => false;
		const stubRegisterHandlers = stub(transactionHandlerProvider, "registerHandlers");

		await context.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry);

		stubRegisterHandlers.neverCalled();
	});

	it("should register a custom type", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);

		assert.not.throws(() => {
			context.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry);
		});
	});

	it("should register a custom type with dependency", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestWithDependencyTransactionHandler);

		assert.not.throws(() => {
			context.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry);
		});
	});

	it("should register a custom type with missing dependency", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestWithDependencyTransactionHandler);

		assert.throws(() =>
			context.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry),
		);
	});

	it("should be able to return handler by data", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		const keys = Identities.Keys.fromPassphrase("secret");
		const data: Interfaces.ITransactionData = {
			amount: Utils.BigNumber.make("200000000"),
			asset: {
				test: 256,
			},
			fee: Utils.BigNumber.make("10000000"),
			nonce: Utils.BigNumber.ONE,
			recipientId: "APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq",
			senderPublicKey: keys.publicKey,
			timestamp: Crypto.Slots.getTime(),
			type: TEST_TRANSACTION_TYPE,
			typeGroup: Enums.TransactionTypeGroup.Test,
			version: 1,
		};

		assert.instance(await transactionHandlerRegistry.getActivatedHandlerForData(data), TestTransactionHandler);
	});

	it("should throw when registering the same key twice", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);

		assert.throws(() => {
			context.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry);
		});
	});

	it("should return all registered core handlers", async (context) => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		assert.length(transactionHandlerRegistry.getRegisteredHandlers(), NUMBER_OF_REGISTERED_CORE_HANDLERS);
	});

	it("should return all registered core and custom handlers", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		assert.length(transactionHandlerRegistry.getRegisteredHandlers(), NUMBER_OF_REGISTERED_CORE_HANDLERS + 1);
	});

	it("should return all active core handlers", async (context) => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		assert.length(
			await transactionHandlerRegistry.getActivatedHandlers(),
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE,
		);

		Managers.configManager.getMilestone().aip11 = true;
		assert.length(
			await transactionHandlerRegistry.getActivatedHandlers(),
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE,
		);
	});

	it("should return all active core and custom handlers", async (context) => {
		context.app.bind(Container.Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		assert.length(
			await transactionHandlerRegistry.getActivatedHandlers(),
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE + 1,
		);

		Managers.configManager.getMilestone().aip11 = true;
		assert.length(
			await transactionHandlerRegistry.getActivatedHandlers(),
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
		assert.instance(
			transactionHandlerRegistry.getRegisteredHandlerByType(internalTransactionType),
			TestTransactionHandler,
		);

		const invalidInternalTransactionType = Transactions.InternalTransactionType.from(
			999,
			Enums.TransactionTypeGroup.Test,
		);

		assert.throws(() => {
			transactionHandlerRegistry.getRegisteredHandlerByType(invalidInternalTransactionType);
		}, "InvalidTransactionTypeError");
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
		assert.instance(
			await transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType),
			TestTransactionHandler,
		);

		const invalidInternalTransactionType = Transactions.InternalTransactionType.from(
			999,
			Enums.TransactionTypeGroup.Test,
		);
		await assert.rejects(
			() => transactionHandlerRegistry.getActivatedHandlerByType(invalidInternalTransactionType),
			"InvalidTransactionTypeError",
		);
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
		await assert.rejects(
			() => transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType, 2),
			"DeactivatedTransactionHandlerError",
		);

		Managers.configManager.getMilestone().aip11 = true;
		assert.instance(
			await transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType, 2),
			Two.DelegateResignationTransactionHandler,
		);
	});
});