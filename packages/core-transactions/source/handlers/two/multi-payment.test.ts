import { Application, Container, Contracts, Exceptions } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@packages/core-state";
import { Factories, Generators } from "@packages/core-test-framework";
import passphrases from "@packages/core-test-framework/source/internal/passphrases.json";
import { InsufficientBalanceError } from "../../errors";
import { TransactionHandler } from "../transaction";
import { TransactionHandlerRegistry } from "../handler-registry";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

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

describe("MultiPaymentTransaction", () => {
	let multiPaymentTransaction: Interfaces.ITransaction;
	let multiSignatureMultiPaymentTransaction: Interfaces.ITransaction;
	let handler: TransactionHandler;

	beforeEach(async () => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);
		handler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(
				Enums.TransactionType.MultiPayment,
				Enums.TransactionTypeGroup.Core,
			),
			2,
		);

		multiPaymentTransaction = Transactions.BuilderFactory.multiPayment()
			.addPayment("ARYJmeYHSUTgbxaiqsgoPwf6M3CYukqdKN", "10")
			.addPayment("AFyjB5jULQiYNsp37wwipCm9c7V1xEzTJD", "20")
			.addPayment("AJwD3UJM7UESFnP1fsKYr4EX9Gc1EJNSqm", "30")
			.addPayment("AUsi9ZcFkcwG7WMpRE121TR4HaTjnAP7qD", "40")
			.addPayment("ARugw4i18i2pVnYZEMWKJj2mAnQQ97wuat", "50")
			.nonce("1")
			.sign(passphrases[0])
			.build();

		multiSignatureMultiPaymentTransaction = Transactions.BuilderFactory.multiPayment()
			.addPayment("ARYJmeYHSUTgbxaiqsgoPwf6M3CYukqdKN", "10")
			.addPayment("AFyjB5jULQiYNsp37wwipCm9c7V1xEzTJD", "20")
			.addPayment("AJwD3UJM7UESFnP1fsKYr4EX9Gc1EJNSqm", "30")
			.addPayment("AUsi9ZcFkcwG7WMpRE121TR4HaTjnAP7qD", "40")
			.addPayment("ARugw4i18i2pVnYZEMWKJj2mAnQQ97wuat", "50")
			.nonce("1")
			.senderPublicKey(multiSignatureWallet.getPublicKey()!)
			.multiSign(passphrases[0], 0)
			.multiSign(passphrases[1], 1)
			.multiSign(passphrases[2], 2)
			.build();
	});

	describe("bootstrap", () => {
		it("should resolve", async () => {
			transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
				yield multiPaymentTransaction.data;
			});

			await expect(handler.bootstrap()).toResolve();

			expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
				typeGroup: Enums.TransactionTypeGroup.Core,
				type: Enums.TransactionType.MultiPayment,
			});
		});

		it("should throw if asset is undefined", async () => {
			multiPaymentTransaction.data.asset = undefined;

			transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
				yield multiPaymentTransaction.data;
			});

			await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
		});
	});

	describe("throwIfCannotBeApplied", () => {
		it("should not throw", async () => {
			await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet)).toResolve();
		});

		it("should not throw - multi sign", async () => {
			await expect(
				handler.throwIfCannotBeApplied(multiSignatureMultiPaymentTransaction, multiSignatureWallet),
			).toResolve();
		});

		it("should throw if asset is undefined", async () => {
			multiPaymentTransaction.data.asset = undefined;

			await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet)).rejects.toThrow(
				Exceptions.Runtime.AssertionException,
			);
		});

		it("should throw if wallet has insufficient funds", async () => {
			senderWallet.setBalance(Utils.BigNumber.ZERO);
			await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet)).rejects.toThrow(
				InsufficientBalanceError,
			);
		});

		it("should throw if wallet has insufficient funds send all payouts", async () => {
			senderWallet.setBalance(Utils.BigNumber.make(150)); // short by the fee
			await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet)).rejects.toThrow(
				InsufficientBalanceError,
			);
		});
	});

	describe("apply", () => {
		it("should be ok", async () => {
			const senderBalance = senderWallet.getBalance();
			const totalPaymentsAmount = multiPaymentTransaction.data.asset.payments.reduce(
				(prev, curr) => prev.plus(curr.amount),
				Utils.BigNumber.ZERO,
			);

			await handler.apply(multiPaymentTransaction);

			expect(senderWallet.getBalance()).toEqual(
				Utils.BigNumber.make(senderBalance).minus(totalPaymentsAmount).minus(multiPaymentTransaction.data.fee),
			);

			for (const { recipientId, amount } of multiPaymentTransaction.data.asset.payments) {
				const paymentRecipientWallet = walletRepository.findByAddress(recipientId);
				expect(paymentRecipientWallet.getBalance()).toEqual(amount);
			}
		});
	});

	describe("applyToSender", () => {
		it("should throw if asset is undefined", async () => {
			multiPaymentTransaction.data.asset = undefined;

			handler.throwIfCannotBeApplied = jest.fn();

			await expect(handler.applyToSender(multiPaymentTransaction)).rejects.toThrow(
				Exceptions.Runtime.AssertionException,
			);
		});
	});

	describe("applyToRecipient", () => {
		it("should throw if asset is undefined", async () => {
			multiPaymentTransaction.data.asset = undefined;

			await expect(handler.applyToRecipient(multiPaymentTransaction)).rejects.toThrow(
				Exceptions.Runtime.AssertionException,
			);
		});
	});

	describe("revert", () => {
		it("should be ok", async () => {
			const senderBalance = senderWallet.getBalance();
			senderWallet.setNonce(Utils.BigNumber.make(1));

			for (const { recipientId, amount } of multiPaymentTransaction.data.asset.payments) {
				const paymentRecipientWallet = walletRepository.findByAddress(recipientId);
				paymentRecipientWallet.setBalance(amount);
			}
			const totalPaymentsAmount = multiPaymentTransaction.data.asset.payments.reduce(
				(prev, curr) => prev.plus(curr.amount),
				Utils.BigNumber.ZERO,
			);

			await handler.revert(multiPaymentTransaction);
			expect(senderWallet.getBalance()).toEqual(
				Utils.BigNumber.make(senderBalance).plus(totalPaymentsAmount).plus(multiPaymentTransaction.data.fee),
			);

			expect(senderWallet.getNonce().isZero()).toBeTrue();
			expect(recipientWallet.getBalance()).toEqual(Utils.BigNumber.ZERO);
		});
	});

	describe("revertForSender", () => {
		it("should throw if asset is undefined", async () => {
			senderWallet.setNonce(Utils.BigNumber.ONE);

			multiPaymentTransaction.data.asset = undefined;

			await expect(handler.revertForSender(multiPaymentTransaction)).rejects.toThrow(
				Exceptions.Runtime.AssertionException,
			);
		});
	});

	describe("revertForRecipient", () => {
		it("should throw if asset is undefined", async () => {
			multiPaymentTransaction.data.asset = undefined;

			await expect(handler.revertForRecipient(multiPaymentTransaction)).rejects.toThrow(
				Exceptions.Runtime.AssertionException,
			);
		});
	});
});
