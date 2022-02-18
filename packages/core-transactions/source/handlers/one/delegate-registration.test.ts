import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { describe, Factories, Generators } from "@arkecosystem/core-test-framework";
import { Crypto, Enums, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import { buildMultiSignatureWallet, buildRecipientWallet, buildSenderWallet, initApp } from "../../../test/app";
import { TransactionHandlerRegistry } from "../handler-registry";
import { TransactionHandler } from "../transaction";

describe<{
	app: Application;
	senderWallet: Wallets.Wallet;
	multiSignatureWallet: Wallets.Wallet;
	recipientWallet: Wallets.Wallet;
	walletRepository: Contracts.State.WalletRepository;
	handler: TransactionHandler;
	store: any;
}>("DelegateRegistrationTransaction V1", ({ assert, afterAll, afterEach, beforeAll, beforeEach, it, stub }) => {
	beforeEach(async (context) => {
		const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4, timestamp: Crypto.Slots.getTime() };
		context.store = stub(Stores.StateStore.prototype, "getLastBlock").returnValue({ data: mockLastBlockData });

		const transactionHistoryService = {
			streamByCriteria: jest.fn(),
		};

		transactionHistoryService.streamByCriteria.mockReset();

		const config = Generators.generateCryptoConfigRaw();
		Managers.configManager.setConfig(config);
		Managers.configManager.getMilestone().aip11 = false;

		context.app = initApp();
		context.app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

		context.walletRepository = context.app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

		const factoryBuilder = new Factories.FactoryBuilder();
		Factories.Factories.registerWalletFactory(factoryBuilder);
		Factories.Factories.registerTransactionFactory(factoryBuilder);

		context.senderWallet = buildSenderWallet(factoryBuilder);
		context.multiSignatureWallet = buildMultiSignatureWallet();
		context.recipientWallet = buildRecipientWallet(factoryBuilder);

		context.walletRepository.index(context.senderWallet);
		context.walletRepository.index(context.multiSignatureWallet);
		context.walletRepository.index(context.recipientWallet);

		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);
		context.handler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(
				Enums.TransactionType.DelegateRegistration,
				Enums.TransactionTypeGroup.Core,
			),
			1,
		);
	});

	afterEach((context) => {
		context.store.restore();
	});

	describe("dependencies", (context) => {
		it("should return empty array", async () => {
			expect(context.handler.dependencies()).toEqual([]);
		});
	});

	describe("walletAttributes", (context) => {
		it("should return array", async () => {
			const attributes = context.handler.walletAttributes();

			expect(attributes).toBeArray();
			expect(attributes.length).toBe(11);
		});
	});

	describe("getConstructor", (context) => {
		it("should return v1 constructor", async () => {
			expect(context.handler.getConstructor()).toBe(Transactions.One.DelegateRegistrationTransaction);
		});
	});

	describe("bootstrap", () => {
		it("should resolve", async (context) => {
			await expect(context.handler.bootstrap()).toResolve();
		});
	});

	describe("isActivated", () => {
		it("should return true", async (context) => {
			await expect(context.handler.isActivated()).resolves.toBeTrue();
		});
	});
});
