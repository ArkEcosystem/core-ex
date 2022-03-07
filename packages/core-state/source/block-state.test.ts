import { Contracts } from "@arkecosystem/core-kernel";
import { BlockState } from "./block-state";
import { StateStore } from "./stores/state";
import { Wallet, WalletRepository } from "./wallets";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { makeChainedBlocks } from "../test/make-chained-block";
import { makeVoteTransactions } from "../test/make-vote-transactions";
import { addTransactionsToBlock } from "../test/transactions";
import { setUp } from "../test/setup";
import { describe, Factories } from "@arkecosystem/core-test-framework";
import { SinonSpy } from "sinon";
import { Spy } from "@arkecosystem/core-test-framework/distribution/uvu/spy";
import { ITransaction } from "@arkecosystem/crypto/distribution/interfaces";

describe<{
	walletRepo: WalletRepository;
	blockState: BlockState;
	stateStore: StateStore;
	factory: Factories.FactoryBuilder;
	applySpy: SinonSpy;
	revertSpy: SinonSpy;
	blocks: Interfaces.IBlock[];
	spyIncreaseWalletDelegateVoteBalance: Spy;
	spyInitGenesisForgerWallet: Spy;
	spyApplyBlockToForger: Spy;
	spyDecreaseWalletDelegateVoteBalance: Spy;
	spyApplyVoteBalances: Spy;
	spyRevertBlockFromForger: Spy;
	forgingWallet: Contracts.State.Wallet;
	votingWallet: Contracts.State.Wallet;
	sendingWallet: Contracts.State.Wallet;
	recipientWallet: Contracts.State.Wallet;
	recipientsDelegate: Contracts.State.Wallet;
	additionalBeforeEach: Function;
	multiPaymentTransaction: Interfaces.ITransaction;
	sendersDelegate: Contracts.State.Wallet;
	amount: Utils.BigNumber;
	generateTransactions: Function;
	forgetWallet: Function;
}>("BlockState", ({ it, assert, beforeEach, beforeAll, afterEach, stub, spy }) => {
	beforeAll(async (context) => {
		const env = await setUp();

		context.walletRepo = env.walletRepo;
		context.blockState = env.blockState;
		context.stateStore = env.stateStore;
		context.factory = env.factory;
		context.applySpy = env.spies.applySpy;
		context.revertSpy = env.spies.revertSpy;

		context.additionalBeforeEach = () => {
			context.sendersDelegate = context.forgingWallet;
			context.sendersDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

			const sendingWallet: Wallet = context.factory
				.get("Wallet")
				.withOptions({
					passphrase: "testPassphrase1",
					nonce: 0,
				})
				.make();

			context.amount = Utils.BigNumber.make(2345);

			context.multiPaymentTransaction = context.factory
				.get("MultiPayment")
				.withOptions({
					amount: context.amount,
					senderPublicKey: sendingWallet.getPublicKey(),
					recipientId: context.recipientWallet.getAddress(),
				})
				.make();

			context.multiPaymentTransaction.data.asset.payments = [
				{
					amount: [context.amount],
					recipientId: "D5T4Cjx7khYbwaaCLmi7j3cUdt4GVWqKkG",
				},
				{
					amount: [context.amount],
					recipientId: "D5T4Cjx7khYbwaaCLmi7j3cUdt4GVWqKkG",
				},
			];
			// TODO: Why do these need to be set manually here?
			context.multiPaymentTransaction.typeGroup = context.multiPaymentTransaction.data.typeGroup;
			context.multiPaymentTransaction.type = context.multiPaymentTransaction.data.type;

			sendingWallet.setAttribute("vote", context.sendersDelegate.getPublicKey());
			context.recipientWallet.setAttribute("vote", context.recipientsDelegate.getPublicKey());
			context.walletRepo.index([
				context.sendersDelegate,
				context.recipientsDelegate,
				sendingWallet,
				context.recipientWallet,
			]);
		};

		context.generateTransactions = () => {
			const sender: any = context.factory
				.get("Wallet")
				.withOptions({
					passphrase: "testPassphrase1",
					nonce: 0,
				})
				.make();

			const recipientWallet: any = context.factory
				.get("Wallet")
				.withOptions({
					passphrase: "testPassphrase2",
				})
				.make();

			const transfer = context.factory
				.get("Transfer")
				.withOptions({ amount: 96579, senderPublicKey: sender.publicKey, recipientId: recipientWallet.address })
				.make();

			const delegateReg = context.factory
				.get("DelegateRegistration")
				.withOptions({
					username: "dummy",
					senderPublicKey: sender.getPublicKey(),
					recipientId: recipientWallet.getAddress(),
				})
				.make()
				// @ts-ignore
				.sign("delegatePassphrase")
				.build();

			const vote = context.factory
				.get("Vote")
				.withOptions({
					publicKey: recipientWallet.publicKey,
					senderPublicKey: sender.publicKey,
					recipientId: recipientWallet.address,
				})
				.make();

			const delegateRes = context.factory
				.get("DelegateResignation")
				.withOptions({
					username: "dummy",
					senderPublicKey: sender.getPublicKey(),
					recipientId: recipientWallet.getAddress(),
				})
				.make()
				// @ts-ignore
				.sign("delegatePassphrase")
				.build();

			return {
				sender,
				recipientWallet,
				transactions: [transfer, delegateReg, vote, delegateRes],
			};
		};

		context.forgetWallet = (wallet: Wallet) => {
			for (const indexName of context.walletRepo.getIndexNames()) {
				const index = context.walletRepo.getIndex(indexName);

				index.forgetWallet(wallet);
			}
		};
	});

	beforeEach((context) => {
		context.blocks = makeChainedBlocks(101, context.factory.get("Block"));

		context.spyIncreaseWalletDelegateVoteBalance = spy(context.blockState, "increaseWalletDelegateVoteBalance");
		context.spyDecreaseWalletDelegateVoteBalance = spy(context.blockState, "decreaseWalletDelegateVoteBalance");
		context.spyInitGenesisForgerWallet = spy(context.blockState, "initGenesisForgerWallet");
		context.spyApplyBlockToForger = spy(context.blockState, "applyBlockToForger");
		context.spyApplyVoteBalances = spy(context.blockState, "applyVoteBalances");
		context.spyRevertBlockFromForger = spy(context.blockState, "revertBlockFromForger");

		context.forgingWallet = context.walletRepo.findByPublicKey(context.blocks[0].data.generatorPublicKey);

		context.forgingWallet.setAttribute("delegate", {
			username: "test",
			forgedFees: Utils.BigNumber.ZERO,
			forgedRewards: Utils.BigNumber.ZERO,
			producedBlocks: 0,
			lastBlock: undefined,
		});

		context.votingWallet = context.factory
			.get("Wallet")
			.withOptions({
				passphrase: "testPassphrase1",
				nonce: 0,
			})
			.make();

		context.sendingWallet = context.factory
			.get("Wallet")
			.withOptions({
				passphrase: "testPassphrase1",
				nonce: 0,
			})
			.make();

		context.recipientWallet = context.factory
			.get("Wallet")
			.withOptions({
				passphrase: "testPassphrase2",
				nonce: 0,
			})
			.make();

		context.recipientsDelegate = context.factory
			.get("Wallet")
			.withOptions({
				passphrase: "recipientDelegate",
				nonce: 0,
			})
			.make();

		context.recipientsDelegate.setAttribute("delegate", {
			username: "test2",
			forgedFees: Utils.BigNumber.ZERO,
			forgedRewards: Utils.BigNumber.ZERO,
			producedBlocks: 0,
			lastBlock: undefined,
		});
		context.recipientsDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

		context.walletRepo.index([
			context.votingWallet,
			context.forgingWallet,
			context.sendingWallet,
			context.recipientWallet,
			context.recipientsDelegate,
		]);

		addTransactionsToBlock(
			makeVoteTransactions(3, [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`]),
			context.blocks[0],
		);
	});

	afterEach((context) => {
		context.walletRepo.reset();

		context.spyIncreaseWalletDelegateVoteBalance.restore();
		context.spyDecreaseWalletDelegateVoteBalance.restore();
		context.spyInitGenesisForgerWallet.restore();
		context.spyApplyBlockToForger.restore();
		context.spyApplyVoteBalances.restore();
		context.spyRevertBlockFromForger.restore();

		context.applySpy.resetHistory();
		context.revertSpy.resetHistory();
	});

	it("should apply sequentially the transactions of the block", async (context) => {
		const spyApplyTransaction = spy(context.blockState, "applyTransaction");
		const stateStoreStub = stub(context.stateStore, "getLastBlock").returnValue(context.blocks[0]);

		await context.blockState.applyBlock(context.blocks[1]);

		for (let i = 0; i < context.blocks[1].transactions.length; i++) {
			spyApplyTransaction.calledWith(context.blocks[0].transactions[i]);
		}

		spyApplyTransaction.restore();
		stateStoreStub.restore();
	});

	it("should call the handler for each transaction", async (context) => {
		const stateStoreStub = stub(context.stateStore, "getLastBlock").returnValue(context.blocks[0]);

		await context.blockState.applyBlock(context.blocks[1]);

		assert.equal(context.applySpy.callCount, context.blocks[1].transactions.length);
		assert.false(context.revertSpy.called);

		stateStoreStub.restore();
	});

	it("should init foring wallet on genesis block", async (context) => {
		const stateStoreStub = stub(context.stateStore, "getLastBlock").returnValue(context.blocks[0]);

		context.blocks[0].data.height = 1;
		await context.blockState.applyBlock(context.blocks[0]);

		context.spyInitGenesisForgerWallet.calledWith(context.blocks[0].data.generatorPublicKey);

		stateStoreStub.restore();
	});

	it("should create forger wallet if it doesn't exist genesis block", async (context) => {
		context.spyApplyBlockToForger.restore();

		const blockStateStub = stub(context.blockState, "applyBlockToForger").callsFake(() => {});
		const spyCreateWallet = spy(context.walletRepo, "createWallet");

		context.blocks[0].data.height = 1;
		context.blocks[0].data.generatorPublicKey =
			"03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";

		await assert.resolves(() => context.blockState.applyBlock(context.blocks[0]));

		context.spyInitGenesisForgerWallet.calledWith(context.blocks[0].data.generatorPublicKey);
		spyCreateWallet.calledTimes(4);

		blockStateStub.restore();
		spyCreateWallet.restore();
	});

	it("should apply the block data to the forger", async (context) => {
		const balanceBefore = context.forgingWallet.getBalance();

		const reward = Utils.BigNumber.make(50);
		const totalFee = Utils.BigNumber.make(50);
		context.blocks[0].data.reward = reward;
		context.blocks[0].data.totalFee = totalFee;
		const balanceIncrease = reward.plus(totalFee);

		await context.blockState.applyBlock(context.blocks[0]);

		context.spyApplyBlockToForger.calledWith(context.forgingWallet, context.blocks[0].data);
		context.spyApplyVoteBalances.calledTimes(3);

		context.spyIncreaseWalletDelegateVoteBalance.calledWith(context.forgingWallet, balanceIncrease);

		const delegateAfter = context.forgingWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");
		const productsBlocks = 1;

		assert.equal(delegateAfter.producedBlocks, productsBlocks);
		assert.equal(delegateAfter.forgedFees, totalFee);
		assert.equal(delegateAfter.forgedRewards, reward);
		assert.equal(delegateAfter.lastBlock, context.blocks[0].data);

		assert.equal(context.forgingWallet.getBalance(), balanceBefore.plus(balanceIncrease));
	});

	it("should revert the block data for the forger", async (context) => {
		const balanceBefore = context.forgingWallet.getBalance();

		const reward = Utils.BigNumber.make(52);
		const totalFee = Utils.BigNumber.make(49);
		context.blocks[0].data.reward = reward;
		context.blocks[0].data.totalFee = totalFee;
		const balanceIncrease = reward.plus(totalFee);

		await context.blockState.applyBlock(context.blocks[0]);

		assert.equal(context.forgingWallet.getBalance(), balanceBefore.plus(balanceIncrease));

		await context.blockState.revertBlock(context.blocks[0]);

		context.spyApplyBlockToForger.calledWith(context.forgingWallet, context.blocks[0].data);
		context.spyRevertBlockFromForger.calledWith(context.forgingWallet, context.blocks[0].data);
		context.spyIncreaseWalletDelegateVoteBalance.calledWith(context.forgingWallet, balanceIncrease);
		context.spyDecreaseWalletDelegateVoteBalance.calledWith(context.forgingWallet, balanceIncrease);

		const delegate = context.forgingWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");

		assert.equal(delegate.producedBlocks, 0);
		assert.equal(delegate.forgedFees, Utils.BigNumber.ZERO);
		assert.equal(delegate.forgedRewards, Utils.BigNumber.ZERO);
		assert.undefined(delegate.lastBlock);

		assert.equal(context.forgingWallet.getBalance(), balanceBefore);
	});

	it("should update sender's and recipient's delegate's vote balance when applying transaction", async (context) => {
		const sendersDelegate = context.forgingWallet;
		sendersDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

		const senderDelegateBefore = sendersDelegate.getAttribute("delegate.voteBalance");

		const amount: Utils.BigNumber = Utils.BigNumber.make(2345);
		context.sendingWallet.setBalance(amount);

		const recipientsDelegateBefore: Utils.BigNumber =
			context.recipientsDelegate.getAttribute("delegate.voteBalance");

		context.sendingWallet.setAttribute("vote", sendersDelegate.getPublicKey());
		context.recipientWallet.setAttribute("vote", context.recipientsDelegate.getPublicKey());

		context.walletRepo.index([
			sendersDelegate,
			context.recipientsDelegate,
			context.sendingWallet,
			context.recipientWallet,
		]);

		const transferTransaction = context.factory
			.get("Transfer")
			.withOptions({
				amount,
				senderPublicKey: context.sendingWallet.getPublicKey(),
				recipientId: context.recipientWallet.getAddress(),
			})
			.make();

		// @ts-ignore
		const total: Utils.BigNumber = transferTransaction.data.amount.plus(transferTransaction.data.fee);
		// @ts-ignore
		await context.blockState.applyTransaction(transferTransaction);

		assert.equal(
			context.recipientsDelegate.getAttribute("delegate.voteBalance"),
			recipientsDelegateBefore.plus(amount),
		);
		assert.equal(sendersDelegate.getAttribute("delegate.voteBalance"), senderDelegateBefore.minus(total));
	});

	it("should update sender's and recipient's delegate's vote balance when reverting transaction", async (context) => {
		const sendersDelegate = context.forgingWallet;
		sendersDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

		const senderDelegateBefore = sendersDelegate.getAttribute("delegate.voteBalance");

		const sendingWallet: Wallet = context.factory
			.get("Wallet")
			.withOptions({
				passphrase: "testPassphrase1",
				nonce: 0,
			})
			.make();

		const amount: Utils.BigNumber = Utils.BigNumber.make(2345);
		sendingWallet.setBalance(amount);

		const recipientDelegateBefore = context.recipientsDelegate.getAttribute("delegate.voteBalance");

		sendingWallet.setAttribute("vote", sendersDelegate.getPublicKey());
		context.recipientWallet.setAttribute("vote", context.recipientsDelegate.getPublicKey());

		context.walletRepo.index([sendersDelegate, context.recipientsDelegate, sendingWallet, context.recipientWallet]);

		const transferTransaction = context.factory
			.get("Transfer")
			.withOptions({
				amount,
				senderPublicKey: sendingWallet.getPublicKey(),
				recipientId: context.recipientWallet.getAddress(),
			})
			.make();

		// @ts-ignore
		const total: Utils.BigNumber = transferTransaction.data.amount.plus(transferTransaction.data.fee);
		// @ts-ignore
		await context.blockState.revertTransaction(transferTransaction);

		assert.equal(
			context.recipientsDelegate.getAttribute("delegate.voteBalance"),
			recipientDelegateBefore.minus(amount),
		);
		assert.equal(sendersDelegate.getAttribute("delegate.voteBalance"), senderDelegateBefore.plus(total));
	});

	it("voteBalances - should not update vote balances if wallet hasn't voted", (context) => {
		const voteBalanceBefore = Utils.BigNumber.ZERO;

		context.forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

		const voteWeight = Utils.BigNumber.make(5678);

		context.blockState.increaseWalletDelegateVoteBalance(context.votingWallet, voteWeight);

		const voteBalanceAfter = context.forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

		assert.equal(voteBalanceAfter, voteBalanceBefore);
	});

	it("voteBalances - should update vote balances", (context) => {
		const voteBalanceBefore = Utils.BigNumber.ZERO;

		context.forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

		const voteWeight = Utils.BigNumber.make(5678);

		context.votingWallet.setBalance(voteWeight);

		context.votingWallet.setAttribute("vote", context.forgingWallet.getPublicKey());

		context.blockState.increaseWalletDelegateVoteBalance(context.votingWallet, voteWeight);

		const voteBalanceAfter = context.forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

		assert.equal(voteBalanceAfter, voteBalanceBefore.plus(voteWeight));
	});

	it("voteBalances - should not revert vote balances if wallet hasn't voted", (context) => {
		const voteBalanceBefore = Utils.BigNumber.ZERO;

		context.forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

		const voteWeight = Utils.BigNumber.make(5678);

		context.blockState.increaseWalletDelegateVoteBalance(context.votingWallet, voteWeight);

		const voteBalanceAfter = context.forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

		assert.equal(voteBalanceAfter, voteBalanceBefore);
	});

	it("voteBalances - should revert vote balances", (context) => {
		const voteBalanceBefore = Utils.BigNumber.make(6789);

		context.forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

		const voteWeight = Utils.BigNumber.make(5678);

		context.votingWallet.setBalance(voteWeight);

		context.votingWallet.setAttribute("vote", context.forgingWallet.getPublicKey());

		context.blockState.decreaseWalletDelegateVoteBalance(context.votingWallet, voteWeight);

		const voteBalanceAfter = context.forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

		assert.equal(voteBalanceAfter, voteBalanceBefore.minus(voteWeight));
	});

	it("voteBalances - should update vote balances for negative votes", async (context) => {
		const voteAddress = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
		addTransactionsToBlock(makeVoteTransactions(3, [`-${voteAddress}`]), context.blocks[0]);

		const sendersBalance = Utils.BigNumber.make(1234);
		const testTransaction = context.blocks[0].transactions[0];

		const sender = context.walletRepo.findByPublicKey(testTransaction.data.senderPublicKey);
		sender.setBalance(sendersBalance);

		const votedForDelegate: Contracts.State.Wallet = context.walletRepo.findByPublicKey(voteAddress);
		const delegateBalanceBefore = Utils.BigNumber.make(4918);
		votedForDelegate.setAttribute("delegate.voteBalance", delegateBalanceBefore);

		await context.blockState.applyTransaction(testTransaction);

		const delegateBalanceAfterApply = votedForDelegate.getAttribute("delegate.voteBalance");
		assert.equal(
			delegateBalanceAfterApply,
			delegateBalanceBefore.minus(sendersBalance.plus(testTransaction.data.fee)),
		);

		await context.blockState.revertTransaction(testTransaction);

		assert.equal(
			votedForDelegate.getAttribute("delegate.voteBalance"),
			delegateBalanceAfterApply.plus(sendersBalance),
		);
	});

	it("when 1 transaction fails while reverting it should apply sequentially (from first to last) all the reverted transactions of the block", async (context) => {
		const apply = spy(context.blockState, "applyTransaction");

		const revert = stub(context.blockState, "revertTransaction").callsFake((tx) => {
			if (tx === context.blocks[0].transactions[0]) {
				throw new Error("Fake error");
			}
		});

		assert.length(context.blocks[0].transactions, 3);
		await assert.rejects(() => context.blockState.revertBlock(context.blocks[0]));

		apply.calledTimes(2);
		assert.true(context.applySpy.calledTwice);

		let counter = 0;
		for (const transaction of context.blocks[0].transactions.slice(1)) {
			apply.calledNthWith(counter++, transaction);
		}

		apply.restore();
		revert.restore();
	});

	it("when 1 transaction fails while reverting it throws the Error", async (context) => {
		const revert = stub(context.blockState, "revertTransaction").callsFake(() => {
			throw new Error("Fake error");
		});

		await assert.rejects(() => context.blockState.revertBlock(context.blocks[0]));

		revert.restore();
	});

	it("when 1 transaction fails while applying it should revert sequentially (from last to first) all the transactions of the block", async (context) => {
		const revert = spy(context.blockState, "revertTransaction");

		const apply = stub(context.blockState, "applyTransaction").callsFake((tx) => {
			if (tx === context.blocks[0].transactions[2]) {
				throw new Error("Fake error");
			}
		});

		const lastBlock = stub(context.stateStore, "getLastBlock").returnValue(context.blocks[1]);

		assert.length(context.blocks[0].transactions, 3);
		await assert.rejects(() => context.blockState.applyBlock(context.blocks[0]));

		revert.calledTimes(2);
		assert.true(context.revertSpy.calledTwice);

		for (const transaction of context.blocks[0].transactions.slice(0, 1)) {
			const i = context.blocks[0].transactions.slice(0, 1).indexOf(transaction);
			const total = context.blocks[0].transactions.slice(0, 1).length;

			revert.calledNthWith(total - i, context.blocks[0].transactions[i]);
		}

		apply.restore();
		revert.restore();
		lastBlock.restore();
	});

	it("when 1 transaction fails while applying it throws the Error", async (context) => {
		const apply = stub(context.blockState, "applyTransaction").callsFake(() => {
			throw new Error("Fake error");
		});

		await assert.rejects(() => context.blockState.applyBlock(context.blocks[0]));

		apply.restore();
	});

	it("multipayment should fail if there are no assets", async (context) => {
		context.additionalBeforeEach();

		context.sendingWallet.forgetAttribute("vote");
		context.walletRepo.index([context.sendingWallet]);

		delete context.multiPaymentTransaction.data.asset;

		await assert.rejects(() => context.blockState.applyTransaction(context.multiPaymentTransaction));
	});

	it("multipayment should fail if there are no assets and sending wallet has voted", async (context) => {
		context.additionalBeforeEach();

		delete context.multiPaymentTransaction.data.asset;

		await assert.rejects(() => context.blockState.applyTransaction(context.multiPaymentTransaction));
	});

	it("multipayment should be okay when recipient hasn't voted", async (context) => {
		context.additionalBeforeEach();

		context.recipientWallet.forgetAttribute("vote");
		context.walletRepo.index([context.recipientWallet]);

		await assert.resolves(() => context.blockState.applyTransaction(context.multiPaymentTransaction));
	});

	it.skip("multipayment should update delegates vote balance for multiPayments", async (context) => {
		context.additionalBeforeEach();

		const senderDelegateBefore = context.sendersDelegate.getAttribute("delegate.voteBalance");
		const recipientsDelegateBefore = context.recipientsDelegate.getAttribute("delegate.voteBalance");

		await context.blockState.applyTransaction(context.multiPaymentTransaction);

		assert.equal(
			context.recipientsDelegate.getAttribute("delegate.voteBalance"),
			recipientsDelegateBefore.plus(context.amount).times(2),
		);
		assert.equal(
			context.sendersDelegate.getAttribute("delegate.voteBalance"),
			senderDelegateBefore.minus(context.amount.times(2).plus(context.multiPaymentTransaction.data.fee)),
		);

		await context.blockState.revertTransaction(context.multiPaymentTransaction);

		assert.equal(context.recipientsDelegate.getAttribute("delegate.voteBalance"), Utils.BigNumber.ZERO);
		assert.equal(context.sendersDelegate.getAttribute("delegate.voteBalance"), Utils.BigNumber.ZERO);
	});

	it("should call the transaction handler apply the transaction to the sender & recipient", async (context) => {
		const transactions = context.generateTransactions();

		for (const transaction of transactions.transactions) {
			await context.blockState.applyTransaction(transaction as ITransaction);

			context.applySpy.calledWith(transaction);
		}
	});

	it("should call be able to revert the transaction", async (context) => {
		const transactions = context.generateTransactions();

		for (const transaction of transactions.transactions) {
			await context.blockState.revertTransaction(transaction as ITransaction);

			context.revertSpy.calledWith(transaction);
		}
	});

	it("not fail to apply transaction if the recipient doesn't exist", async (context) => {
		const transactions = context.generateTransactions();

		for (const transaction of transactions.transactions) {
			// @ts-ignore
			transaction.data.recipientId = "don'tExist";

			context.forgetWallet(transactions.recipientWallet);

			await assert.resolves(() => context.blockState.applyTransaction(transaction as ITransaction));
		}
	});

	it("not fail to revert transaction if the recipient doesn't exist", async (context) => {
		const transactions = context.generateTransactions();

		for (const transaction of transactions.transactions) {
			// @ts-ignore
			transaction.data.recipientId = "don'tExist";

			context.forgetWallet(transactions.recipientWallet);

			await assert.resolves(() => context.blockState.revertTransaction(transaction as ITransaction));
		}
	});

	it("vote should fail if there are no assets", async (context) => {
		const transactions = context.generateTransactions();

		const voteTransaction = context.factory
			.get("Vote")
			.withOptions({
				publicKey: transactions.recipientWallet.publicKey,
				senderPublicKey: transactions.sender.publicKey,
				recipientId: transactions.recipientWallet.address,
			})
			.make();

		// @ts-ignore
		delete voteTransaction.data.asset;

		await assert.rejects(() => context.blockState.applyTransaction(voteTransaction as Interfaces.ITransaction));
	});
});
