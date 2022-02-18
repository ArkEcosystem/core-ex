import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { describe, Factories, Generators } from "@arkecosystem/core-test-framework";
import { Crypto, Enums, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import { buildMultiSignatureWallet, buildRecipientWallet, buildSenderWallet, initApp } from "../../../test/app";
import { TransactionHandlerRegistry } from "../handler-registry";
import {TransactionHandler} from "../transaction";

interface SuiteContext {
	app: Application;
	senderWallet: Wallets.Wallet;
	multiSignatureWallet: Wallets.Wallet;
	recipientWallet: Wallets.Wallet;
	walletRepository: Contracts.State.WalletRepository;
	factoryBuilder: Factories.FactoryBuilder;
	store: any;
	transferTransaction: Interfaces.ITransaction;
	multiSignatureTransferTransaction: Interfaces.ITransaction;
	handler: TransactionHandler;
	pubKeyHash: number;
}

describe("TransferTransaction V1", ({ assert, afterEach, beforeEach, it, spy, stub }) => {
	const transactionHistoryService = {
		streamByCriteria: spy(),
	};

	beforeEach((context: SuiteContext) => {
		const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4, timestamp: Crypto.Slots.getTime() };
		context.store = stub(Stores.StateStore.prototype, "getLastBlock").returnValue({ data: mockLastBlockData });

		Managers.configManager.setConfig(Generators.generateCryptoConfigRaw());
		Managers.configManager.getMilestone().aip11 = false;

		context.app = initApp();
		context.app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

		context.walletRepository = context.app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

		context.factoryBuilder = new Factories.FactoryBuilder();
		Factories.Factories.registerWalletFactory(context.factoryBuilder);
		Factories.Factories.registerTransactionFactory(context.factoryBuilder);

		context.senderWallet = buildSenderWallet(context.factoryBuilder);
		context.multiSignatureWallet = buildMultiSignatureWallet();
		context.recipientWallet = buildRecipientWallet(context.factoryBuilder);

		context.walletRepository.index(context.senderWallet);
		context.walletRepository.index(context.multiSignatureWallet);
		context.walletRepository.index(context.recipientWallet);

		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		context.handler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(Enums.TransactionType.Transfer, Enums.TransactionTypeGroup.Core),
			1,
		);
	});

	afterEach((context) => {
		context.store.restore();
	});

	it("should return empty array", async (context) => {
		assert.equal(context.handler.dependencies(), []);
	});

	it("should return array", async (context) => {
		const attributes = context.handler.walletAttributes();

		assert.array(attributes);
		assert.is(attributes.length, 0);
	});

	it("should return v1 constructor", async (context) => {
		assert.equal(context.handler.getConstructor(), Transactions.One.TransferTransaction);
	});

	it("should resolve", async (context) => {
		await assert.resolves(() => context.handler.bootstrap());
	});

	it("should return true", async (context) => {
		assert.true(await context.handler.isActivated());
	});
});
