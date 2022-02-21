import "jest-extended";

import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/source/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/source/stores/state";
import { Generators } from "@packages/core-test-framework/source";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/source/factories";
import { TransactionHandler } from "@packages/core-transactions/source/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/source/handlers/handler-registry";
import { Crypto, Enums, Interfaces, Managers, Transactions } from "@packages/crypto";
import { configManager } from "@packages/crypto/source/managers";

import { buildMultiSignatureWallet, buildRecipientWallet, buildSenderWallet, initApp } from "../__support__/app";

let app: Application;
let senderWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };
const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

const transactionHistoryService = {
	streamByCriteria: jest.fn(),
};

beforeEach(() => {
	transactionHistoryService.streamByCriteria.mockReset();

	const config = Generators.generateCryptoConfigRaw();
	configManager.setConfig(config);
	Managers.configManager.setConfig(config);
	configManager.getMilestone().aip11 = false;
	Managers.configManager.getMilestone().aip11 = false;

	app = initApp();
	app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

	walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

	factoryBuilder = new FactoryBuilder();
	Factories.registerWalletFactory(factoryBuilder);
	Factories.registerTransactionFactory(factoryBuilder);

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
			Identifiers.TransactionHandlerRegistry,
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