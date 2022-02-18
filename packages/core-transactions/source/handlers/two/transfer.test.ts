import { Container } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { describe, Factories, Generators, Mapper, Mocks, passphrases } from "@arkecosystem/core-test-framework";
import { TransactionHandlerRegistry } from "../handler-registry";
import { TransferTransactionHandler } from "../one";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { buildMultiSignatureWallet, buildRecipientWallet, buildSenderWallet, initApp } from "../../../test/app";

describe("TransferTransaction", ({ assert, afterEach, beforeEach, it, stub }) => {
	beforeEach(async (context) => {
		const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };
		context.store = stub(Stores.StateStore.prototype, "getLastBlock").returnValue({ data: mockLastBlockData });

		Managers.configManager.setConfig(Generators.generateCryptoConfigRaw());

		context.app = initApp();
		context.app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(null);

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

		context.pubKeyHash = Managers.configManager.get("network.pubKeyHash");
		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);
		context.handler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(Enums.TransactionType.Transfer, Enums.TransactionTypeGroup.Core),
			2,
		);

		context.transferTransaction = Transactions.BuilderFactory.transfer()
			.recipientId(context.recipientWallet.getAddress())
			.amount("10000000")
			.sign(passphrases[0])
			.nonce("1")
			.build();

		context.multiSignatureTransferTransaction = Transactions.BuilderFactory.transfer()
			.senderPublicKey(context.multiSignatureWallet.getPublicKey()!)
			.recipientId(context.recipientWallet.getAddress())
			.amount("1")
			.nonce("1")
			.multiSign(passphrases[0], 0)
			.multiSign(passphrases[1], 1)
			.multiSign(passphrases[2], 2)
			.build();
	});

	afterEach((context) => {
		Mocks.TransactionRepository.setTransactions([]);
		Managers.configManager.set("network.pubKeyHash", context.pubKeyHash);
		context.store.restore();
	});

	describe("bootstrap", (context) => {
		it("should resolve", async (context) => {
			Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(context.transferTransaction)]);
			await assert.resolves(() => context.handler.bootstrap());
		});
	});

	describe("hasVendorField", () => {
		it("should return true", (context) => {
			assert.true((<TransferTransactionHandler>context.handler).hasVendorField());
		});
	});

	describe("throwIfCannotBeApplied", (context) => {
		it("should not throw", async (context) => {
			await assert.resolves(() =>
				context.handler.throwIfCannotBeApplied(context.transferTransaction, context.senderWallet),
			);
		});

		it("should not throw - multi sign", async (context) => {
			await assert.resolves(() =>
				context.handler.throwIfCannotBeApplied(
					context.multiSignatureTransferTransaction,
					context.multiSignatureWallet,
				),
			);
		});

		it("should throw", async (context) => {
			context.transferTransaction.data.senderPublicKey = "a".repeat(66);

			await assert.rejects(
				() => context.handler.throwIfCannotBeApplied(context.transferTransaction, context.senderWallet),
				"SenderWalletMismatchError",
			);
		});

		it("should throw if wallet has insufficient funds for vote", async (context) => {
			context.senderWallet.setBalance(Utils.BigNumber.ZERO);

			await assert.rejects(
				() => context.handler.throwIfCannotBeApplied(context.transferTransaction, context.senderWallet),
				"InsufficientBalanceError",
			);
		});

		it("should throw if sender is cold wallet", async (context) => {
			const coldWallet: Wallets.Wallet = context.factoryBuilder
				.get("Wallet")
				.withOptions({
					passphrase: passphrases[3],
					nonce: 0,
				})
				.make();

			coldWallet.setBalance(Utils.BigNumber.ZERO);

			context.transferTransaction = Transactions.BuilderFactory.transfer()
				.amount("10000000")
				.recipientId(context.recipientWallet.getAddress())
				.nonce("1")
				.sign(passphrases[3])
				.build();

			await assert.rejects(
				() => context.handler.throwIfCannotBeApplied(context.transferTransaction, coldWallet),
				"ColdWalletError",
			);
		});

		it("should not throw if recipient is cold wallet", async (context) => {
			const coldWallet: Wallets.Wallet = context.factoryBuilder
				.get("Wallet")
				.withOptions({
					passphrase: passphrases[3],
					nonce: 0,
				})
				.make();

			coldWallet.setBalance(Utils.BigNumber.ZERO);

			context.transferTransaction = Transactions.BuilderFactory.transfer()
				.amount("10000000")
				.recipientId(coldWallet.getAddress())
				.nonce("1")
				.sign(passphrases[0])
				.build();

			await assert.resolves(() =>
				context.handler.throwIfCannotBeApplied(context.transferTransaction, context.senderWallet),
			);
		});
	});

	describe("throwIfCannotEnterPool", () => {
		it("should not throw", async (context) => {
			await assert.resolves(() => context.handler.throwIfCannotEnterPool(context.transferTransaction));
		});

		it("should throw if no wallet is not recipient on the active network", async (context) => {
			Managers.configManager.set("network.pubKeyHash", 99);

			await assert.rejects(
				() => context.handler.throwIfCannotEnterPool(context.transferTransaction),
				"Recipient AWrp3vKnMoefPXRyooJdX9zGjsyv1QKUG7 is not on the same network: 99",
			);
			// await assert.rejects(() => context.handler.throwIfCannotEnterPool(context.transferTransaction), Contracts.TransactionPool.PoolError);
		});
	});

	describe("apply", () => {
		it("should be ok", async (context) => {
			const senderBalance = context.senderWallet.getBalance();
			const recipientBalance = context.recipientWallet.getBalance();

			await context.handler.apply(context.transferTransaction);

			assert.equal(
				context.senderWallet.getBalance(),
				Utils.BigNumber.make(senderBalance)
					.minus(context.transferTransaction.data.amount)
					.minus(context.transferTransaction.data.fee),
			);

			assert.equal(
				context.recipientWallet.getBalance(),
				Utils.BigNumber.make(recipientBalance).plus(context.transferTransaction.data.amount),
			);
		});
	});

	describe("revert", () => {
		it("should be ok", async (context) => {
			const senderBalance = context.senderWallet.getBalance();
			const recipientBalance = context.recipientWallet.getBalance();

			await context.handler.apply(context.transferTransaction);

			assert.equal(
				context.senderWallet.getBalance(),
				Utils.BigNumber.make(senderBalance)
					.minus(context.transferTransaction.data.amount)
					.minus(context.transferTransaction.data.fee),
			);

			assert.equal(
				context.recipientWallet.getBalance(),
				Utils.BigNumber.make(recipientBalance).plus(context.transferTransaction.data.amount),
			);

			await context.handler.revert(context.transferTransaction);

			assert.equal(context.senderWallet.getBalance(), Utils.BigNumber.make(senderBalance));

			assert.equal(context.recipientWallet.getBalance(), recipientBalance);
		});
	});
});
