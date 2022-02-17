import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@packages/core-state";
import { Factories, Generators } from "@packages/core-test-framework";
import { Crypto, Enums, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { TransactionHandler } from "../transaction";
import { TransactionHandlerRegistry } from "../handler-registry";

import { buildMultiSignatureWallet, buildRecipientWallet, buildSenderWallet, initApp } from "../__support__/app";

let app: Application;
let senderWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: Factories.FactoryBuilder;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };
const mockGetLastBlock = jest.fn();
Stores.StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

const transactionHistoryService = {
	streamByCriteria: jest.fn(),
};

beforeEach(() => {
	transactionHistoryService.streamByCriteria.mockReset();

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
});

describe("DelegateRegistrationTransaction V1", () => {
	let handler: TransactionHandler;

	beforeEach(async () => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);

		handler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(Enums.TransactionType.Transfer, Enums.TransactionTypeGroup.Core),
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
			expect(attributes.length).toBe(0);
		});
	});

	describe("getConstructor", () => {
		it("should return v1 constructor", async () => {
			expect(handler.getConstructor()).toBe(Transactions.One.TransferTransaction);
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
