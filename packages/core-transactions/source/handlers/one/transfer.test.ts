import { Container } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { describe, Factories, Generators } from "@arkecosystem/core-test-framework";
import { Crypto, Enums, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import { buildMultiSignatureWallet, buildRecipientWallet, buildSenderWallet, initApp } from "../../../test/app";
import { TransactionHandlerRegistry } from "../handler-registry";

describe("TransferTransaction V1", ({ assert, beforeEach, it, spy, stub }) => {
	const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4, timestamp: Crypto.Slots.getTime() };
	stub(Stores.StateStore.prototype, "getLastBlock").returnValue({ data: mockLastBlockData });

	const transactionHistoryService = {
		streamByCriteria: spy(),
	};

	beforeEach((context) => {
		const config = Generators.generateCryptoConfigRaw();
		Managers.configManager.setConfig(config);
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
