import { Application, Services } from "@arkecosystem/core-kernel";
import { Container } from "@arkecosystem/core-container";
import { BigNumber, ByteBuffer } from "@arkecosystem/utils";
import { Contracts, Exceptions, Identifiers } from "@arkecosystem/core-contracts";
import { describe } from "../../../core-test-framework/source";

import { ServiceProvider } from "../service-provider";
import { TransactionHandlerProvider } from "./handler-provider";
import { TransactionHandlerRegistry } from "./handler-registry";
import { TransactionHandler, TransactionHandlerConstructor } from "./index";
import {
	schemas,
	Transaction,
	TransactionRegistry,
	TransactionTypeFactory,
} from "@arkecosystem/core-crypto-transaction";
import { MultiPaymentTransactionHandler } from "../../../core-crypto-transaction-multi-payment/source/handlers";
import { MultiSignatureRegistrationTransactionHandler } from "../../../core-crypto-transaction-multi-signature-registration/source/handlers";
import { TransferTransactionHandler } from "../../../core-crypto-transaction-transfer/source/handlers";
import { ValidatorResignationTransactionHandler } from "../../../core-crypto-transaction-validator-resignation/source/handlers";
import { ValidatorRegistrationTransactionHandler } from "../../../core-crypto-transaction-validator-registration/source/handlers";
import { PublicKeyFactory } from "../../../core-crypto-key-pair-schnorr/source/public";
import { VoteTransactionHandler } from "../../../core-crypto-transaction-vote/source/handlers";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { Validator } from "@arkecosystem/core-validation/source/validator";
import { AddressFactory } from "@arkecosystem/core-crypto-address-base58/source/address.factory";
import { Verifier } from "@arkecosystem/core-crypto-transaction/source";

const NUMBER_OF_REGISTERED_CORE_HANDLERS = 10;
const NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE = 7; // TODO: Check if correct
const NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE = 9;

const TEST_TRANSACTION_TYPE = 100;
const DEPENDANT_TEST_TRANSACTION_TYPE = 101;

abstract class TestTransaction extends Transaction {
	public static type: number = TEST_TRANSACTION_TYPE;
	public static typeGroup: number = Contracts.Crypto.TransactionTypeGroup.Test;
	public static key = "test";

	async deserialize(buf: ByteBuffer): Promise<void> {}

	async serialize(): Promise<ByteBuffer | undefined> {
		return undefined;
	}

	public static getSchema(): schemas.TransactionSchema {
		return schemas.extend(schemas.transactionBaseSchema, {
			$id: "test",
		});
	}
}

abstract class TestWithDependencyTransaction extends Transaction {
	public static type: number = DEPENDANT_TEST_TRANSACTION_TYPE;
	public static typeGroup: number = Contracts.Crypto.TransactionTypeGroup.Test;
	public static key = "test_with_dependency";

	async deserialize(buf: ByteBuffer): Promise<void> {}

	async serialize(): Promise<ByteBuffer | undefined> {
		return undefined;
	}

	public static getSchema(): schemas.TransactionSchema {
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

	getConstructor(): Contracts.Crypto.TransactionConstructor {
		return TestTransaction;
	}

	async bootstrap(): Promise<void> {
		return;
	}

	async isActivated(): Promise<boolean> {
		return true;
	}

	async applyToRecipient(transaction: Contracts.Crypto.ITransaction): Promise<void> {}

	async revertForRecipient(transaction: Contracts.Crypto.ITransaction): Promise<void> {}
}

class TestWithDependencyTransactionHandler extends TransactionHandler {
	dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
		return [TestTransactionHandler];
	}

	walletAttributes(): ReadonlyArray<string> {
		return [];
	}

	getConstructor(): Contracts.Crypto.TransactionConstructor {
		return TestWithDependencyTransaction;
	}

	async bootstrap(): Promise<void> {
		return;
	}

	async isActivated(): Promise<boolean> {
		return true;
	}

	async applyToRecipient(transaction: Contracts.Crypto.ITransaction): Promise<void> {}

	async revertForRecipient(transaction: Contracts.Crypto.ITransaction): Promise<void> {}
}

describe<{
	app: Application;
}>("Registry", ({ assert, afterEach, beforeEach, it, stub }) => {
	beforeEach((context) => {
		const app = new Application(new Container());

		app.bind(Identifiers.TransactionHistoryService).toConstantValue(null);
		app.bind(Identifiers.ApplicationNamespace).toConstantValue("ark-unitnet");
		app.bind(Identifiers.LogService).toConstantValue({});

		app.bind<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes)
			.to(Services.Attributes.AttributeSet)
			.inSingletonScope();
		app.bind(Identifiers.WalletRepository).toConstantValue({});
		app.bind(Identifiers.TransactionPoolQuery).toConstantValue({});

		app.bind(Identifiers.Cryptography.Transaction.Registry).to(TransactionRegistry);
		app.bind(Identifiers.Cryptography.Validator).toConstantValue(Validator);
		app.bind(Identifiers.Cryptography.Transaction.TypeFactory).toConstantValue(TransactionTypeFactory);
		app.bind(Identifiers.Cryptography.Identity.AddressFactory).toConstantValue(AddressFactory);
		app.bind(Identifiers.Cryptography.Identity.PublicKeyFactory).toConstantValue(PublicKeyFactory);
		app.bind(Identifiers.Cryptography.Transaction.Verifier).toConstantValue(Verifier);

		app.bind(Identifiers.TransactionHandler).to(TransferTransactionHandler);
		app.bind(Identifiers.TransactionHandler).to(ValidatorRegistrationTransactionHandler);
		app.bind(Identifiers.TransactionHandler).to(VoteTransactionHandler);
		app.bind(Identifiers.TransactionHandler).to(MultiSignatureRegistrationTransactionHandler);
		app.bind(Identifiers.TransactionHandler).to(MultiPaymentTransactionHandler);
		app.bind(Identifiers.TransactionHandler).to(ValidatorResignationTransactionHandler);

		app.bind(Identifiers.TransactionHandlerProvider).to(TransactionHandlerProvider).inSingletonScope();
		app.bind(Identifiers.TransactionHandlerRegistry).to(TransactionHandlerRegistry).inSingletonScope();
		app.bind(Identifiers.TransactionHandlerConstructors).toDynamicValue(
			ServiceProvider.getTransactionHandlerConstructorsBinding(),
		);

		app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();

		context.app = app;
	});

	it.only("should register core transaction types", async (context) => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Identifiers.TransactionHandlerRegistry,
		);

		await assert.resolves(() =>
			Promise.all([
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Contracts.Transactions.InternalTransactionType.from(
						Contracts.Crypto.TransactionType.Transfer,
						Contracts.Crypto.TransactionTypeGroup.Core,
					),
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Contracts.Transactions.InternalTransactionType.from(
						Contracts.Crypto.TransactionType.ValidatorRegistration,
						Contracts.Crypto.TransactionTypeGroup.Core,
					),
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Contracts.Transactions.InternalTransactionType.from(
						Contracts.Crypto.TransactionType.Vote,
						Contracts.Crypto.TransactionTypeGroup.Core,
					),
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Contracts.Transactions.InternalTransactionType.from(
						Contracts.Crypto.TransactionType.MultiSignature,
						Contracts.Crypto.TransactionTypeGroup.Core,
					),
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Contracts.Transactions.InternalTransactionType.from(
						Contracts.Crypto.TransactionType.MultiPayment,
						Contracts.Crypto.TransactionTypeGroup.Core,
					),
				),
				transactionHandlerRegistry.getRegisteredHandlerByType(
					Contracts.Transactions.InternalTransactionType.from(
						Contracts.Crypto.TransactionType.ValidatorRegistration,
						Contracts.Crypto.TransactionTypeGroup.Core,
					),
				),
			]),
		);
	});

	it("should skip handler registration if provider handlerProvider is already registered", async (context) => {
		const transactionHandlerProvider = context.app.get<TransactionHandlerProvider>(
			Identifiers.TransactionHandlerProvider,
		);

		transactionHandlerProvider.isRegistrationRequired = () => false;
		const stubRegisterHandlers = stub(transactionHandlerProvider, "registerHandlers");

		await context.app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

		stubRegisterHandlers.neverCalled();
	});

	it("should register a custom type", async (context) => {
		context.app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);

		assert.not.throws(() => {
			context.app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
		});
	});

	it("should register a custom type with dependency", async (context) => {
		context.app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
		context.app.bind(Identifiers.TransactionHandler).to(TestWithDependencyTransactionHandler);

		assert.not.throws(() => {
			context.app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
		});
	});

	it("should register a custom type with missing dependency", async (context) => {
		context.app.bind(Identifiers.TransactionHandler).to(TestWithDependencyTransactionHandler);

		assert.throws(() => context.app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry));
	});

	it("should be able to return handler by data", async (context) => {
		context.app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Identifiers.TransactionHandlerRegistry,
		);

		const keys: Contracts.Crypto.IKeyPair = await context.app
			.get<Contracts.Crypto.IKeyPairFactory>(Identifiers.Cryptography.Identity.KeyPairFactory)
			.fromMnemonic("secret");
		const slots: Contracts.Crypto.Slots = await context.app.get<Contracts.Crypto.Slots>(
			Identifiers.Cryptography.Time.Slots,
		);

		const data: Contracts.Crypto.ITransactionData = {
			amount: BigNumber.make("200000000"),
			asset: {
				test: 256,
			},
			fee: BigNumber.make("10000000"),
			nonce: BigNumber.ONE,
			recipientId: "APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq",
			senderPublicKey: keys.publicKey,
			timestamp: slots.getTime(),
			type: TEST_TRANSACTION_TYPE,
			typeGroup: Contracts.Crypto.TransactionTypeGroup.Test,
			version: 1,
		};

		assert.instance(await transactionHandlerRegistry.getActivatedHandlerForData(data), TestTransactionHandler);
	});

	it("should throw when registering the same key twice", async (context) => {
		context.app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
		context.app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);

		assert.throws(() => {
			context.app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
		});
	});

	it("should return all registered core handlers", async (context) => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Identifiers.TransactionHandlerRegistry,
		);

		assert.length(transactionHandlerRegistry.getRegisteredHandlers(), NUMBER_OF_REGISTERED_CORE_HANDLERS);
	});

	it("should return all registered core and custom handlers", async (context) => {
		context.app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Identifiers.TransactionHandlerRegistry,
		);

		assert.length(transactionHandlerRegistry.getRegisteredHandlers(), NUMBER_OF_REGISTERED_CORE_HANDLERS + 1);
	});

	it("should return all active core handlers", async (context) => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Identifiers.TransactionHandlerRegistry,
		);

		assert.length(
			await transactionHandlerRegistry.getActivatedHandlers(),
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE,
		);

		context.app.get<Configuration>(Identifiers.Cryptography.Configuration).getMilestone().aip11 = true;
		assert.length(
			await transactionHandlerRegistry.getActivatedHandlers(),
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE,
		);
	});

	it("should return all active core and custom handlers", async (context) => {
		context.app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Identifiers.TransactionHandlerRegistry,
		);

		assert.length(
			await transactionHandlerRegistry.getActivatedHandlers(),
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE + 1,
		);

		context.app.get<Configuration>(Identifiers.Cryptography.Configuration).getMilestone().aip11 = true;
		assert.length(
			await transactionHandlerRegistry.getActivatedHandlers(),
			NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE + 1,
		);
	});

	it("should return a registered custom handler", async (context) => {
		context.app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Identifiers.TransactionHandlerRegistry,
		);

		const internalTransactionType = Contracts.Transactions.InternalTransactionType.from(
			TEST_TRANSACTION_TYPE,
			Contracts.Crypto.TransactionTypeGroup.Test,
		);
		assert.instance(
			transactionHandlerRegistry.getRegisteredHandlerByType(internalTransactionType),
			TestTransactionHandler,
		);

		const invalidInternalTransactionType = Contracts.Transactions.InternalTransactionType.from(
			999,
			Contracts.Crypto.TransactionTypeGroup.Test,
		);

		await assert.rejects(() => {
			transactionHandlerRegistry.getRegisteredHandlerByType(invalidInternalTransactionType);
		}, Exceptions.InvalidTransactionTypeError);
	});

	it("should return a activated custom handler", async (context) => {
		context.app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Identifiers.TransactionHandlerRegistry,
		);

		const internalTransactionType = Contracts.Transactions.InternalTransactionType.from(
			TEST_TRANSACTION_TYPE,
			Contracts.Crypto.TransactionTypeGroup.Test,
		);
		assert.instance(
			await transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType),
			TestTransactionHandler,
		);

		const invalidInternalTransactionType = Contracts.Transactions.InternalTransactionType.from(
			999,
			Contracts.Crypto.TransactionTypeGroup.Test,
		);
		await assert.rejects(
			() => transactionHandlerRegistry.getActivatedHandlerByType(invalidInternalTransactionType),
			Exceptions.InvalidTransactionTypeError,
		);
	});

	it("should not return deactivated custom handler", async (context) => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Identifiers.TransactionHandlerRegistry,
		);
		const internalTransactionType = Contracts.Transactions.InternalTransactionType.from(
			Contracts.Crypto.TransactionType.ValidatorResignation,
			Contracts.Crypto.TransactionTypeGroup.Core,
		);

		context.app.get<Configuration>(Identifiers.Cryptography.Configuration).getMilestone().aip11 = false;
		await assert.rejects(
			() => transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType, 2),
			"DeactivatedTransactionHandlerError",
		);

		context.app.get<Configuration>(Identifiers.Cryptography.Configuration).getMilestone().aip11 = true;
		assert.instance(
			await transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType, 2),
			ValidatorResignationTransactionHandler,
		);
	});
});
