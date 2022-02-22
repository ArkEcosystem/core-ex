import { Application, Container, Contracts, Enums as AppEnums, Exceptions } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { describe, Factories, Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import {
	AlreadyVotedError,
	InsufficientBalanceError,
	NoVoteError,
	UnvoteMismatchError,
	VotedForNonDelegateError,
} from "../../errors";
import { buildMultiSignatureWallet, buildRecipientWallet, buildSenderWallet, initApp } from "../../../test/app";
import { TransactionHandlerRegistry } from "../handler-registry";
import { TransactionHandler } from "../transaction";

describe<{
	app: Application;
	senderWallet: Wallets.Wallet;
	multiSignatureWallet: Wallets.Wallet;
	recipientWallet: Wallets.Wallet;
	walletRepository: Contracts.State.WalletRepository;
	factoryBuilder: Factories.FactoryBuilder;
	voteTransaction: Interfaces.ITransaction;
	multiSignatureVoteTransaction: Interfaces.ITransaction;
	unvoteTransaction: Interfaces.ITransaction;
	multiSignatureUnvoteTransaction: Interfaces.ITransaction;
	voteUnvoteTransaction: Interfaces.ITransaction;
	unvoteVoteTransaction: Interfaces.ITransaction;
	voteVoteTransaction: Interfaces.ITransaction;
	unvoteUnvoteTransaction: Interfaces.ITransaction;
	delegateWallet1: Wallets.Wallet;
	delegateWallet2: Wallets.Wallet;
	handler: TransactionHandler;
	store: any;
	transactionHistoryService: any;
}>("VoteTransaction", ({ assert, afterEach, beforeEach, it, spy, stub }) => {
	beforeEach(async (context) => {
		const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4, timestamp: Crypto.Slots.getTime() };
		context.store = stub(Stores.StateStore.prototype, "getLastBlock").returnValue({ data: mockLastBlockData });

		context.transactionHistoryService = {
			streamByCriteria: () => undefined,
		};

		const config = Generators.generateCryptoConfigRaw();
		Managers.configManager.setConfig(config);

		context.app = initApp();
		context.app
			.bind(Container.Identifiers.TransactionHistoryService)
			.toConstantValue(context.transactionHistoryService);

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
			Transactions.InternalTransactionType.from(Enums.TransactionType.Vote, Enums.TransactionTypeGroup.Core),
			2,
		);

		context.delegateWallet1 = context.factoryBuilder
			.get("Wallet")
			.withOptions({
				nonce: 0,
				passphrase: passphrases[8],
			})
			.make();
		context.delegateWallet1.setAttribute("delegate", { username: "test1" });
		context.walletRepository.index(context.delegateWallet1);

		context.delegateWallet2 = context.factoryBuilder
			.get("Wallet")
			.withOptions({
				nonce: 0,
				passphrase: passphrases[9],
			})
			.make();
		context.delegateWallet2.setAttribute("delegate", { username: "test2" });
		context.walletRepository.index(context.delegateWallet2);

		context.voteTransaction = Transactions.BuilderFactory.vote()
			.version(2)
			.votesAsset(["+" + context.delegateWallet1.getPublicKey()!])
			.nonce("1")
			.sign(passphrases[0])
			.build();

		context.multiSignatureVoteTransaction = Transactions.BuilderFactory.vote()
			.version(2)
			.senderPublicKey(context.multiSignatureWallet.getPublicKey()!)
			.votesAsset(["+" + context.delegateWallet1.getPublicKey()!])
			.nonce("1")
			.multiSign(passphrases[0], 0)
			.multiSign(passphrases[1], 1)
			.multiSign(passphrases[2], 2)
			.build();

		context.unvoteTransaction = Transactions.BuilderFactory.vote()
			.version(2)
			.votesAsset(["-" + context.delegateWallet1.getPublicKey()!])
			.nonce("1")
			.sign(passphrases[0])
			.build();

		context.multiSignatureUnvoteTransaction = Transactions.BuilderFactory.vote()
			.version(2)
			.senderPublicKey(context.multiSignatureWallet.getPublicKey()!)
			.votesAsset(["-" + context.delegateWallet1.getPublicKey()!])
			.nonce("1")
			.multiSign(passphrases[0], 0)
			.multiSign(passphrases[1], 1)
			.multiSign(passphrases[2], 2)
			.build();

		context.voteUnvoteTransaction = Transactions.BuilderFactory.vote()
			.version(2)
			.votesAsset(["+" + context.delegateWallet1.getPublicKey()!, "-" + context.delegateWallet1.getPublicKey()!])
			.nonce("1")
			.sign(passphrases[0])
			.build();

		context.unvoteVoteTransaction = Transactions.BuilderFactory.vote()
			.version(2)
			.votesAsset(["-" + context.delegateWallet1.getPublicKey()!, "+" + context.delegateWallet2.getPublicKey()!])
			.nonce("1")
			.sign(passphrases[0])
			.build();

		context.voteVoteTransaction = Transactions.BuilderFactory.vote()
			.version(2)
			.votesAsset(["+" + context.delegateWallet1.getPublicKey()!, "+" + context.delegateWallet2.getPublicKey()!])
			.nonce("1")
			.sign(passphrases[0])
			.build();

		context.unvoteUnvoteTransaction = Transactions.BuilderFactory.vote()
			.version(2)
			.votesAsset(["-" + context.delegateWallet1.getPublicKey()!, "-" + context.delegateWallet2.getPublicKey()!])
			.nonce("1")
			.sign(passphrases[0])
			.build();
	});

	it("bootstrap should resolve", async (context) => {
		stub(context.transactionHistoryService, "streamByCriteria").callsFake(async function* () {
			yield context.voteTransaction.data;
			yield context.unvoteTransaction.data;
		});

		await assert.resolves(() => context.handler.bootstrap());

		context.transactionHistoryService.streamByCriteria.calledWith({
			type: Enums.TransactionType.Vote,
			typeGroup: Enums.TransactionTypeGroup.Core,
		});
	});

	it("bootstrap should throw on vote if wallet already voted", async (context) => {
		context.transactionHistoryService.streamByCriteria = async function* () {
			yield context.voteTransaction.data;
		};
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());

		await assert.rejects(() => context.handler.bootstrap(), AlreadyVotedError);
	});

	it("bootstrap should throw on unvote if wallet did not vote", async (context) => {
		context.transactionHistoryService.streamByCriteria = async function* () {
			yield context.unvoteTransaction.data;
		};

		await assert.rejects(() => context.handler.bootstrap(), NoVoteError);
	});

	it("bootstrap should throw on unvote if wallet vote is mismatch", async (context) => {
		context.transactionHistoryService.streamByCriteria = async function* () {
			yield context.unvoteTransaction.data;
		};
		context.senderWallet.setAttribute("vote", "no_a_public_key");

		await assert.rejects(() => context.handler.bootstrap(), UnvoteMismatchError);
	});

	it("bootstrap should throw if asset is undefined", async (context) => {
		context.unvoteTransaction.data.asset = undefined;
		context.transactionHistoryService.streamByCriteria = async function* () {
			yield context.unvoteTransaction.data;
		};

		await assert.rejects(() => context.handler.bootstrap(), Exceptions.Runtime.AssertionException);
	});

	it.only("emitEvents should dispatch", async (context) => {
		const emitter: Contracts.Kernel.EventDispatcher = context.app.get<Contracts.Kernel.EventDispatcher>(
			Container.Identifiers.EventDispatcherService,
		);

		const mock = spy(emitter, "dispatch");

		context.handler.emitEvents(context.voteTransaction, emitter);

		assert.true(mock.calledWith(AppEnums.VoteEvent.Vote));
		assert.true(mock.notCalledWith(AppEnums.VoteEvent.Unvote));

		mock.resetHistory();
		context.handler.emitEvents(context.unvoteTransaction, emitter);

		assert.true(mock.notCalledWith(AppEnums.VoteEvent.Vote));
		assert.true(mock.calledWith(AppEnums.VoteEvent.Unvote));

		mock.resetHistory();
		context.handler.emitEvents(context.voteUnvoteTransaction, emitter);

		assert.true(mock.calledWith(AppEnums.VoteEvent.Vote));
		assert.true(mock.calledWith(AppEnums.VoteEvent.Unvote));
	});

	it("emitEvents should throw if asset.votes is undefined", async (context) => {
		const emitter: Contracts.Kernel.EventDispatcher = context.app.get<Contracts.Kernel.EventDispatcher>(
			Container.Identifiers.EventDispatcherService,
		);

		context.voteTransaction.data.asset.votes = undefined;

		expect(() => {
			context.handler.emitEvents(context.voteTransaction, emitter);
		}).toThrow(Exceptions.Runtime.AssertionException);
	});

	it("emitEvents should throw if asset is undefined", async (context) => {
		const emitter: Contracts.Kernel.EventDispatcher = context.app.get<Contracts.Kernel.EventDispatcher>(
			Container.Identifiers.EventDispatcherService,
		);

		context.voteTransaction.data.asset = undefined;

		expect(() => {
			context.handler.emitEvents(context.voteTransaction, emitter);
		}).toThrow(Exceptions.Runtime.AssertionException);
	});

	it("throwIfCannotBeApplied should not throw if the vote is valid and the wallet has not voted", async (context) => {
		await expect(context.handler.throwIfCannotBeApplied(context.voteTransaction, context.senderWallet)).toResolve();
	});

	it("throwIfCannotBeApplied should not throw - multi sign vote", async (context) => {
		await expect(
			context.handler.throwIfCannotBeApplied(context.multiSignatureVoteTransaction, context.multiSignatureWallet),
		).toResolve();
	});

	it("throwIfCannotBeApplied should not throw if the unvote is valid and the wallet has voted", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());
		await expect(
			context.handler.throwIfCannotBeApplied(context.unvoteTransaction, context.senderWallet),
		).toResolve();
	});

	it("throwIfCannotBeApplied should not throw - multi sign unvote", async (context) => {
		context.multiSignatureWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());
		await expect(
			context.handler.throwIfCannotBeApplied(
				context.multiSignatureUnvoteTransaction,
				context.multiSignatureWallet,
			),
		).toResolve();
	});

	it("throwIfCannotBeApplied should throw if wallet has already voted", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());
		await expect(
			context.handler.throwIfCannotBeApplied(context.voteTransaction, context.senderWallet),
		).rejects.toThrow(AlreadyVotedError);
	});

	it("throwIfCannotBeApplied should throw if vote for non delegate wallet", async (context) => {
		context.delegateWallet1.forgetAttribute("delegate");
		context.walletRepository.index(context.delegateWallet1);
		await expect(
			context.handler.throwIfCannotBeApplied(context.voteTransaction, context.senderWallet),
		).rejects.toThrow(VotedForNonDelegateError);
	});

	it("throwIfCannotBeApplied should throw if the asset public key differs from the currently voted one", async (context) => {
		context.senderWallet.setAttribute("vote", "a310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0");
		await expect(
			context.handler.throwIfCannotBeApplied(context.unvoteTransaction, context.senderWallet),
		).rejects.toThrow(UnvoteMismatchError);
	});

	it("throwIfCannotBeApplied should throw if unvoting a non-voted wallet", async (context) => {
		await expect(
			context.handler.throwIfCannotBeApplied(context.unvoteTransaction, context.senderWallet),
		).rejects.toThrow(NoVoteError);
	});

	it("throwIfCannotBeApplied should throw if wallet has insufficient funds for vote", async (context) => {
		context.senderWallet.setBalance(Utils.BigNumber.ZERO);
		await expect(
			context.handler.throwIfCannotBeApplied(context.voteTransaction, context.senderWallet),
		).rejects.toThrow(InsufficientBalanceError);
	});

	it("throwIfCannotBeApplied should throw if wallet has insufficient funds for unvote", async (context) => {
		context.senderWallet.setBalance(Utils.BigNumber.ZERO);
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());
		await expect(
			context.handler.throwIfCannotBeApplied(context.unvoteTransaction, context.senderWallet),
		).rejects.toThrow(InsufficientBalanceError);
	});

	it("throwIfCannotBeApplied should throw if asset.votes is undefined", async (context) => {
		context.voteTransaction.data.asset.votes = undefined;

		await expect(
			context.handler.throwIfCannotBeApplied(context.voteTransaction, context.senderWallet),
		).rejects.toThrow(Exceptions.Runtime.AssertionException);
	});

	it("throwIfCannotBeApplied should throw if asset is undefined", async (context) => {
		context.voteTransaction.data.asset = undefined;

		await expect(
			context.handler.throwIfCannotBeApplied(context.voteTransaction, context.senderWallet),
		).rejects.toThrow(Exceptions.Runtime.AssertionException);
	});

	it("throwIfCannotBeApplied should not throw on vote+unvote transaction when wallet has not voted", async (context) => {
		await context.handler.throwIfCannotBeApplied(context.voteUnvoteTransaction, context.senderWallet);
	});

	it("throwIfCannotBeApplied should throw on vote+unvote transaction when wallet has voted", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());

		await expect(
			context.handler.throwIfCannotBeApplied(context.voteUnvoteTransaction, context.senderWallet),
		).rejects.toThrow(AlreadyVotedError);
	});

	it("throwIfCannotBeApplied should not throw on unvote+vote transaction when wallet has voted", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());

		await context.handler.throwIfCannotBeApplied(context.unvoteVoteTransaction, context.senderWallet);
	});

	it("throwIfCannotBeApplied should throw on unvote+vote transaction when wallet has not voted", async (context) => {
		await expect(
			context.handler.throwIfCannotBeApplied(context.unvoteVoteTransaction, context.senderWallet),
		).rejects.toThrow(NoVoteError);
	});

	it("throwIfCannotBeApplied should throw on vote+vote transaction when wallet has not voted", async (context) => {
		await expect(
			context.handler.throwIfCannotBeApplied(context.voteVoteTransaction, context.senderWallet),
		).rejects.toThrow(AlreadyVotedError);
	});

	it("throwIfCannotBeApplied should throw on unvote+unvote transaction when wallet has voted", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());

		await expect(
			context.handler.throwIfCannotBeApplied(context.unvoteUnvoteTransaction, context.senderWallet),
		).rejects.toThrow(NoVoteError);
	});

	it("throwIfCannotEnterPool should not throw", async (context) => {
		await expect(context.handler.throwIfCannotEnterPool(context.voteTransaction)).toResolve();
	});

	it("throwIfCannotEnterPool should throw if transaction by sender already in pool", async (context) => {
		await context.app
			.get<Mempool>(Container.Identifiers.TransactionPoolMempool)
			.addTransaction(context.voteTransaction);

		await expect(context.handler.throwIfCannotEnterPool(context.voteTransaction)).rejects.toThrow(
			Contracts.TransactionPool.PoolError,
		);
	});

	it("apply vote should be ok", async (context) => {
		expect(context.senderWallet.hasAttribute("vote")).toBeFalse();

		await context.handler.apply(context.voteTransaction);
		expect(context.senderWallet.getAttribute("vote")).not.toBeUndefined();
	});

	it("apply vote should not be ok", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());

		expect(context.senderWallet.getAttribute("vote")).not.toBeUndefined();

		await expect(context.handler.apply(context.voteTransaction)).rejects.toThrow(AlreadyVotedError);

		expect(context.senderWallet.getAttribute("vote")).not.toBeUndefined();
	});

	it("apply unvote should remove the vote from the wallet", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());

		expect(context.senderWallet.getAttribute("vote")).not.toBeUndefined();

		await context.handler.apply(context.unvoteTransaction);

		expect(context.senderWallet.hasAttribute("vote")).toBeFalse();
	});

	it("apply vote+unvote should apply when wallet has not voted", async (context) => {
		await context.handler.apply(context.voteUnvoteTransaction);

		expect(context.senderWallet.hasAttribute("vote")).toBeFalse();
	});

	it("apply vote+unvote should throw when wallet has voted", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());

		await expect(context.handler.apply(context.voteUnvoteTransaction)).rejects.toThrow(AlreadyVotedError);
	});

	it("apply unvote+vote should apply when wallet has voted", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());

		await context.handler.apply(context.unvoteVoteTransaction);

		expect(context.senderWallet.getAttribute("vote")).toEqual(context.delegateWallet2.getPublicKey());
	});

	it("apply unvote+vote should throw when wallet has not voted", async (context) => {
		await expect(context.handler.apply(context.unvoteUnvoteTransaction)).rejects.toThrow(NoVoteError);
	});

	it("apply unvote+vote should throw when wallet has voted for different delegate", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet2.getPublicKey());

		await expect(context.handler.apply(context.unvoteUnvoteTransaction)).rejects.toThrow(UnvoteMismatchError);
	});

	it("applyForSender should throw if asset.vote is undefined", async (context) => {
		context.voteTransaction.data.asset.votes = undefined;

		context.handler.throwIfCannotBeApplied = jest.fn();

		await expect(context.handler.applyToSender(context.voteTransaction)).rejects.toThrow(
			Exceptions.Runtime.AssertionException,
		);
	});

	it("applyForSender should throw if asset is undefined", async (context) => {
		context.voteTransaction.data.asset = undefined;

		context.handler.throwIfCannotBeApplied = jest.fn();

		await expect(context.handler.applyToSender(context.voteTransaction)).rejects.toThrow(
			Exceptions.Runtime.AssertionException,
		);
	});

	it("revert vote should remove the vote from the wallet", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet1.getPublicKey());
		context.senderWallet.setNonce(Utils.BigNumber.make(1));

		expect(context.senderWallet.getAttribute("vote")).not.toBeUndefined();

		await context.handler.revert(context.voteTransaction);

		expect(context.senderWallet.getNonce().isZero()).toBeTrue();
		expect(context.senderWallet.hasAttribute("vote")).toBeFalse();
	});

	it("revert unvote should add the vote to the wallet", async (context) => {
		context.senderWallet.setNonce(Utils.BigNumber.make(1));

		expect(context.senderWallet.hasAttribute("vote")).toBeFalse();

		await context.handler.revert(context.unvoteTransaction);

		expect(context.senderWallet.getNonce().isZero()).toBeTrue();
		expect(context.senderWallet.getAttribute("vote")).toBe(context.delegateWallet1.getPublicKey());
	});

	it("revert vote+unvote should revert when wallet has no vote", async (context) => {
		context.senderWallet.setNonce(Utils.BigNumber.make(1));

		await context.handler.revert(context.voteUnvoteTransaction);

		expect(context.senderWallet.hasAttribute("vote")).toBeFalse();
	});

	it("revert unvote+vote should revert when wallet has no vote", async (context) => {
		context.senderWallet.setAttribute("vote", context.delegateWallet2.getPublicKey());
		context.senderWallet.setNonce(Utils.BigNumber.make(1));

		await context.handler.revert(context.unvoteVoteTransaction);

		expect(context.senderWallet.getAttribute("vote")).toEqual(context.delegateWallet1.getPublicKey());
	});

	it("revertForSender should throw if asset.vote is undefined", async (context) => {
		context.voteTransaction.data.asset.votes = undefined;

		context.senderWallet.setNonce(Utils.BigNumber.ONE);

		await expect(context.handler.revertForSender(context.voteTransaction)).rejects.toThrow(
			Exceptions.Runtime.AssertionException,
		);
	});

	it("revertForSender should throw if asset is undefined", async (context) => {
		context.voteTransaction.data.asset = undefined;

		context.senderWallet.setNonce(Utils.BigNumber.ONE);

		await assert.rejects(
			() => context.handler.revertForSender(context.voteTransaction),
			Exceptions.Runtime.AssertionException,
		);
	});
});
