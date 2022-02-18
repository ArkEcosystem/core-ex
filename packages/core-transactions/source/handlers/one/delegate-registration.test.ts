import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { describe } from "@arkecosystem/core-test";
import { Factories, Generators } from "@arkecosystem/core-test-framework";
import { Crypto, Enums, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import { buildMultiSignatureWallet, buildRecipientWallet, buildSenderWallet, initApp } from "../../../test/app";
import { TransactionHandlerRegistry } from "../handler-registry";
import { TransactionHandler } from "../transaction";

describe("DelegateRegistrationTransaction V1", ({ assert, afterAll, afterEach, beforeAll, beforeEach, it }) => {
	let senderWallet: Wallets.Wallet;
	let multiSignatureWallet: Wallets.Wallet;
	let recipientWallet: Wallets.Wallet;
	let walletRepository: Contracts.State.WalletRepository;
	let handler: TransactionHandler;

	beforeEach(async (context) => {
		const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4, timestamp: Crypto.Slots.getTime() };
		const mockGetLastBlock = jest.fn();
		Stores.StateStore.prototype.getLastBlock = mockGetLastBlock;
		mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

		const transactionHistoryService = {
			streamByCriteria: jest.fn(),
		};

		transactionHistoryService.streamByCriteria.mockReset();

		const config = Generators.generateCryptoConfigRaw();
		Managers.configManager.setConfig(config);
		Managers.configManager.getMilestone().aip11 = false;

		context.app = initApp();
		context.app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

		walletRepository = context.app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

		const factoryBuilder = new Factories.FactoryBuilder();
		Factories.Factories.registerWalletFactory(factoryBuilder);
		Factories.Factories.registerTransactionFactory(factoryBuilder);

		senderWallet = buildSenderWallet(factoryBuilder);
		multiSignatureWallet = buildMultiSignatureWallet();
		recipientWallet = buildRecipientWallet(factoryBuilder);

		walletRepository.index(senderWallet);
		walletRepository.index(multiSignatureWallet);
		walletRepository.index(recipientWallet);

		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);
		handler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(
				Enums.TransactionType.DelegateRegistration,
				Enums.TransactionTypeGroup.Core,
			),
			1,
		);
	});

	describe("dependencies", () => {
		it("should return empty array", async () => {
			expect(handler.dependencies()).toEqual([]);
		});
	});

	describe("walletAttributes", () => {
		it("should return array", async () => {
			const attributes = handler.walletAttributes();

			expect(attributes).toBeArray();
			expect(attributes.length).toBe(11);
		});
	});

	describe("getConstructor", () => {
		it("should return v1 constructor", async () => {
			expect(handler.getConstructor()).toBe(Transactions.One.DelegateRegistrationTransaction);
		});
	});

	describe("bootstrap", () => {
		it("should resolve", async () => {
			await expect(handler.bootstrap()).toResolve();
		});
	});

	describe("isActivated", () => {
		it("should return true", async () => {
			await expect(handler.isActivated()).resolves.toBeTrue();
		});
	});
});
