import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { describe, Factories, Generators } from "@arkecosystem/core-test-framework";
import { Crypto, Enums, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import { buildMultiSignatureWallet, buildRecipientWallet, buildSenderWallet, initApp } from "../../../test/app";
import { TransactionHandlerRegistry } from "../handler-registry";
import { TransactionHandler } from "../transaction";

describe("TransferTransaction V1", ({ assert, beforeEach, it, spy, stub }) => {
	let handler: TransactionHandler;

	let app: Application;
	let senderWallet: Wallets.Wallet;
	let multiSignatureWallet: Wallets.Wallet;
	let recipientWallet: Wallets.Wallet;
	let walletRepository: Contracts.State.WalletRepository;
	let factoryBuilder: Factories.FactoryBuilder;

	const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4, timestamp: Crypto.Slots.getTime() };
	stub(Stores.StateStore.prototype, "getLastBlock").returnValue({ data: mockLastBlockData });

	const transactionHistoryService = {
		streamByCriteria: spy(),
	};

	beforeEach(() => {
		const config = Generators.generateCryptoConfigRaw();
		Managers.configManager.setConfig(config);
		Managers.configManager.getMilestone().aip11 = false;

		app = initApp();
		app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

		walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

		factoryBuilder = new Factories.FactoryBuilder();
		Factories.Factories.registerWalletFactory(factoryBuilder);
		Factories.Factories.registerTransactionFactory(factoryBuilder);

		senderWallet = buildSenderWallet(factoryBuilder);
		multiSignatureWallet = buildMultiSignatureWallet();
		recipientWallet = buildRecipientWallet(factoryBuilder);

		walletRepository.index(senderWallet);
		walletRepository.index(multiSignatureWallet);
		walletRepository.index(recipientWallet);

		const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		handler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(Enums.TransactionType.Transfer, Enums.TransactionTypeGroup.Core),
			1,
		);
	});

	it("should return empty array", async () => {
		assert.equal(handler.dependencies(), []);
	});

	it("should return array", async () => {
		const attributes = handler.walletAttributes();

		assert.array(attributes);
		assert.is(attributes.length, 0);
	});

	it("should return v1 constructor", async () => {
		assert.equal(handler.getConstructor(), Transactions.One.TransferTransaction);
	});

	it("should resolve", async () => {
		await assert.resolves(() => handler.bootstrap());
	});

	it("should return true", async () => {
		assert.true(await handler.isActivated());
	});
});
