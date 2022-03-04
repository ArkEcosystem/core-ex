import { Contracts } from "@arkecosystem/core-kernel";
import { BlockState } from "./block-state";
import { StateStore } from "./stores/state";
import { Wallet, WalletRepository } from "./wallets";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { makeChainedBlocks } from "../test/make-chained-block";
import { makeVoteTransactions } from "../test/make-vote-transactions";
import { addTransactionsToBlock } from "../test/transactions";
import { setUp, setUpDefaults } from "../test/setup";
import { describe, Factories } from "@arkecosystem/core-test-framework";
import { SinonSpy } from "sinon";
import { Spy } from "@arkecosystem/core-test-framework/distribution/uvu/spy";
import { ITransaction } from "@arkecosystem/crypto/distribution/interfaces";

let blockState: BlockState;
let stateStore: StateStore;
let factory: Factories.FactoryBuilder;
let blocks: Interfaces.IBlock[];
let walletRepo: WalletRepository;
let forgingWallet: Contracts.State.Wallet;
let votingWallet: Contracts.State.Wallet;
let sendingWallet: Contracts.State.Wallet;
let recipientWallet: Contracts.State.Wallet;
let recipientsDelegate: Contracts.State.Wallet;

let applySpy: SinonSpy;
let revertSpy: SinonSpy;
let spyIncreaseWalletDelegateVoteBalance: Spy;
let spyInitGenesisForgerWallet: Spy;
let spyApplyBlockToForger: Spy;
let spyDecreaseWalletDelegateVoteBalance: Spy;
let spyApplyVoteBalances: Spy;
let spyRevertBlockFromForger: Spy;

const forgetWallet = (wallet: Wallet) => {
	for (const indexName of walletRepo.getIndexNames()) {
		const index = walletRepo.getIndex(indexName);

		index.forgetWallet(wallet);
	}
};

const beforeAllCallback = async () => {
	const initialEnv = await setUp(setUpDefaults, true); // todo: why do I have to skip booting?
	walletRepo = initialEnv.walletRepo;
	blockState = initialEnv.blockState;
	stateStore = initialEnv.stateStore;
	factory = initialEnv.factory;
	applySpy = initialEnv.spies.applySpy;
	revertSpy = initialEnv.spies.revertSpy;
};

const beforeEachCallback = (spy: (owner?: object, method?: string) => Spy) => {
	return () => {
		blocks = makeChainedBlocks(101, factory.get("Block"));

		spyIncreaseWalletDelegateVoteBalance = spy(blockState, "increaseWalletDelegateVoteBalance");
		spyDecreaseWalletDelegateVoteBalance = spy(blockState, "decreaseWalletDelegateVoteBalance");
		spyInitGenesisForgerWallet = spy(blockState as any, "initGenesisForgerWallet");
		spyApplyBlockToForger = spy(blockState as any, "applyBlockToForger");
		spyApplyVoteBalances = spy(blockState as any, "applyVoteBalances");
		spyRevertBlockFromForger = spy(blockState as any, "revertBlockFromForger");

		forgingWallet = walletRepo.findByPublicKey(blocks[0].data.generatorPublicKey);

		forgingWallet.setAttribute("delegate", {
			username: "test",
			forgedFees: Utils.BigNumber.ZERO,
			forgedRewards: Utils.BigNumber.ZERO,
			producedBlocks: 0,
			lastBlock: undefined,
		});

		votingWallet = factory
			.get("Wallet")
			.withOptions({
				passphrase: "testPassphrase1",
				nonce: 0,
			})
			.make();

		sendingWallet = factory
			.get("Wallet")
			.withOptions({
				passphrase: "testPassphrase1",
				nonce: 0,
			})
			.make();

		recipientWallet = factory
			.get("Wallet")
			.withOptions({
				passphrase: "testPassphrase2",
				nonce: 0,
			})
			.make();

		recipientsDelegate = factory
			.get("Wallet")
			.withOptions({
				passphrase: "recipientDelegate",
				nonce: 0,
			})
			.make();

		recipientsDelegate.setAttribute("delegate", {
			username: "test2",
			forgedFees: Utils.BigNumber.ZERO,
			forgedRewards: Utils.BigNumber.ZERO,
			producedBlocks: 0,
			lastBlock: undefined,
		});
		recipientsDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

		walletRepo.index([votingWallet, forgingWallet, sendingWallet, recipientWallet, recipientsDelegate]);

		addTransactionsToBlock(
			makeVoteTransactions(3, [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`]),
			blocks[0],
		);
	};
};

const afterEachCallback = () => {
	walletRepo.reset();
};

describe("BlockState", ({ it, assert, beforeEach, beforeAll, afterEach, stub, spy }) => {
	beforeEach(beforeEachCallback(spy));
	beforeAll(beforeAllCallback);
	afterEach(afterEachCallback);

	it("should apply sequentially the transactions of the block", async () => {
		const spyApplyTransaction = spy(blockState, "applyTransaction");

		stub(stateStore, "getLastBlock").returnValue(blocks[0]);

		await blockState.applyBlock(blocks[1]);

		for (let i = 0; i < blocks[1].transactions.length; i++) {
			spyApplyTransaction.calledWith(blocks[0].transactions[i]);
		}

		spyApplyTransaction.restore();
	});

	it("should call the handler for each transaction", async () => {
		stub(stateStore, "getLastBlock").returnValue(blocks[0]);

		await blockState.applyBlock(blocks[1]);

		assert.equal(applySpy.callCount, blocks[1].transactions.length);
		assert.false(revertSpy.called);
	});

	it("should init foring wallet on genesis block", async () => {
		stub(stateStore, "getLastBlock").returnValue(blocks[0]);

		blocks[0].data.height = 1;
		await blockState.applyBlock(blocks[0]);

		spyInitGenesisForgerWallet.calledWith(blocks[0].data.generatorPublicKey);
	});

	it("should create forger wallet if it doesn't exist genesis block", async () => {
		spyApplyBlockToForger.restore();
		stub(blockState, "applyBlockToForger").callsFake(() => {});

		const spyCreateWallet = spy(walletRepo, "createWallet");
		blocks[0].data.height = 1;
		blocks[0].data.generatorPublicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";

		await assert.resolves(() => blockState.applyBlock(blocks[0]));

		spyInitGenesisForgerWallet.calledWith(blocks[0].data.generatorPublicKey);
		spyCreateWallet.calledTimes(4);
	});

	it("should apply the block data to the forger", async () => {
		const balanceBefore = forgingWallet.getBalance();

		const reward = Utils.BigNumber.make(50);
		const totalFee = Utils.BigNumber.make(50);
		blocks[0].data.reward = reward;
		blocks[0].data.totalFee = totalFee;
		const balanceIncrease = reward.plus(totalFee);

		await blockState.applyBlock(blocks[0]);

		spyApplyBlockToForger.calledWith(forgingWallet, blocks[0].data);
		spyApplyVoteBalances.calledTimes(3);

		spyIncreaseWalletDelegateVoteBalance.calledWith(forgingWallet, balanceIncrease);

		const delegateAfter = forgingWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");
		const productsBlocks = 1;

		assert.equal(delegateAfter.producedBlocks, productsBlocks);
		assert.equal(delegateAfter.forgedFees, totalFee);
		assert.equal(delegateAfter.forgedRewards, reward);
		assert.equal(delegateAfter.lastBlock, blocks[0].data);

		assert.equal(forgingWallet.getBalance(), balanceBefore.plus(balanceIncrease));
	});

	it("should revert the block data for the forger", async () => {
		const balanceBefore = forgingWallet.getBalance();

		const reward = Utils.BigNumber.make(52);
		const totalFee = Utils.BigNumber.make(49);
		blocks[0].data.reward = reward;
		blocks[0].data.totalFee = totalFee;
		const balanceIncrease = reward.plus(totalFee);

		await blockState.applyBlock(blocks[0]);

		assert.equal(forgingWallet.getBalance(), balanceBefore.plus(balanceIncrease));

		await blockState.revertBlock(blocks[0]);

		spyApplyBlockToForger.calledWith(forgingWallet, blocks[0].data);
		spyRevertBlockFromForger.calledWith(forgingWallet, blocks[0].data);
		spyIncreaseWalletDelegateVoteBalance.calledWith(forgingWallet, balanceIncrease);
		spyDecreaseWalletDelegateVoteBalance.calledWith(forgingWallet, balanceIncrease);

		const delegate = forgingWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");

		assert.equal(delegate.producedBlocks, 0);
		assert.equal(delegate.forgedFees, Utils.BigNumber.ZERO);
		assert.equal(delegate.forgedRewards, Utils.BigNumber.ZERO);
		assert.undefined(delegate.lastBlock);

		assert.equal(forgingWallet.getBalance(), balanceBefore);
	});

	it("should update sender's and recipient's delegate's vote balance when applying transaction", async () => {
		const sendersDelegate = forgingWallet;
		sendersDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

		const senderDelegateBefore = sendersDelegate.getAttribute("delegate.voteBalance");

		const amount: Utils.BigNumber = Utils.BigNumber.make(2345);
		sendingWallet.setBalance(amount);

		const recipientsDelegateBefore: Utils.BigNumber = recipientsDelegate.getAttribute("delegate.voteBalance");

		sendingWallet.setAttribute("vote", sendersDelegate.getPublicKey());
		recipientWallet.setAttribute("vote", recipientsDelegate.getPublicKey());

		walletRepo.index([sendersDelegate, recipientsDelegate, sendingWallet, recipientWallet]);

		const transferTransaction = factory
			.get("Transfer")
			.withOptions({
				amount,
				senderPublicKey: sendingWallet.getPublicKey(),
				recipientId: recipientWallet.getAddress(),
			})
			.make();

		// @ts-ignore
		const total: Utils.BigNumber = transferTransaction.data.amount.plus(transferTransaction.data.fee);
		// @ts-ignore
		await blockState.applyTransaction(transferTransaction);

		assert.equal(recipientsDelegate.getAttribute("delegate.voteBalance"), recipientsDelegateBefore.plus(amount));
		assert.equal(sendersDelegate.getAttribute("delegate.voteBalance"), senderDelegateBefore.minus(total));
	});

	it("should update sender's and recipient's delegate's vote balance when reverting transaction", async () => {
		const sendersDelegate = forgingWallet;
		sendersDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

		const senderDelegateBefore = sendersDelegate.getAttribute("delegate.voteBalance");

		const sendingWallet: Wallet = factory
			.get("Wallet")
			.withOptions({
				passphrase: "testPassphrase1",
				nonce: 0,
			})
			.make();

		const amount: Utils.BigNumber = Utils.BigNumber.make(2345);
		sendingWallet.setBalance(amount);

		const recipientDelegateBefore = recipientsDelegate.getAttribute("delegate.voteBalance");

		sendingWallet.setAttribute("vote", sendersDelegate.getPublicKey());
		recipientWallet.setAttribute("vote", recipientsDelegate.getPublicKey());

		walletRepo.index([sendersDelegate, recipientsDelegate, sendingWallet, recipientWallet]);

		const transferTransaction = factory
			.get("Transfer")
			.withOptions({
				amount,
				senderPublicKey: sendingWallet.getPublicKey(),
				recipientId: recipientWallet.getAddress(),
			})
			.make();

		// @ts-ignore
		const total: Utils.BigNumber = transferTransaction.data.amount.plus(transferTransaction.data.fee);
		// @ts-ignore
		await blockState.revertTransaction(transferTransaction);

		assert.equal(recipientsDelegate.getAttribute("delegate.voteBalance"), recipientDelegateBefore.minus(amount));
		assert.equal(sendersDelegate.getAttribute("delegate.voteBalance"), senderDelegateBefore.plus(total));
	});
});

describe("voteBalances", ({ it, assert, beforeEach, beforeAll, afterEach, spy }) => {
	beforeEach(beforeEachCallback(spy));
	beforeAll(beforeAllCallback);
	afterEach(afterEachCallback);

	it("should not update vote balances if wallet hasn't voted", () => {
		const voteBalanceBefore = Utils.BigNumber.ZERO;

		forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

		const voteWeight = Utils.BigNumber.make(5678);

		blockState.increaseWalletDelegateVoteBalance(votingWallet, voteWeight);

		const voteBalanceAfter = forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

		assert.equal(voteBalanceAfter, voteBalanceBefore);
	});

	it("should update vote balances", () => {
		const voteBalanceBefore = Utils.BigNumber.ZERO;

		forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

		const voteWeight = Utils.BigNumber.make(5678);

		votingWallet.setBalance(voteWeight);

		votingWallet.setAttribute("vote", forgingWallet.getPublicKey());

		blockState.increaseWalletDelegateVoteBalance(votingWallet, voteWeight);

		const voteBalanceAfter = forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

		assert.equal(voteBalanceAfter, voteBalanceBefore.plus(voteWeight));
	});

	it("should not revert vote balances if wallet hasn't voted", () => {
		const voteBalanceBefore = Utils.BigNumber.ZERO;

		forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

		const voteWeight = Utils.BigNumber.make(5678);

		blockState.increaseWalletDelegateVoteBalance(votingWallet, voteWeight);

		const voteBalanceAfter = forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

		assert.equal(voteBalanceAfter, voteBalanceBefore);
	});

	it("should revert vote balances", () => {
		const voteBalanceBefore = Utils.BigNumber.make(6789);

		forgingWallet.setAttribute<Utils.BigNumber>("delegate.voteBalance", voteBalanceBefore);

		const voteWeight = Utils.BigNumber.make(5678);

		votingWallet.setBalance(voteWeight);

		votingWallet.setAttribute("vote", forgingWallet.getPublicKey());

		blockState.decreaseWalletDelegateVoteBalance(votingWallet, voteWeight);

		const voteBalanceAfter = forgingWallet.getAttribute<Utils.BigNumber>("delegate.voteBalance");

		assert.equal(voteBalanceAfter, voteBalanceBefore.minus(voteWeight));
	});

	it("should update vote balances for negative votes", async () => {
		const voteAddress = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
		addTransactionsToBlock(makeVoteTransactions(3, [`-${voteAddress}`]), blocks[0]);

		const sendersBalance = Utils.BigNumber.make(1234);
		const testTransaction = blocks[0].transactions[0];

		const sender = walletRepo.findByPublicKey(testTransaction.data.senderPublicKey);
		sender.setBalance(sendersBalance);

		const votedForDelegate: Contracts.State.Wallet = walletRepo.findByPublicKey(voteAddress);
		const delegateBalanceBefore = Utils.BigNumber.make(4918);
		votedForDelegate.setAttribute("delegate.voteBalance", delegateBalanceBefore);

		await blockState.applyTransaction(testTransaction);

		const delegateBalanceAfterApply = votedForDelegate.getAttribute("delegate.voteBalance");
		assert.equal(
			delegateBalanceAfterApply,
			delegateBalanceBefore.minus(sendersBalance.plus(testTransaction.data.fee)),
		);

		await blockState.revertTransaction(testTransaction);

		assert.equal(
			votedForDelegate.getAttribute("delegate.voteBalance"),
			delegateBalanceAfterApply.plus(sendersBalance),
		);
	});
});

describe("Multipayment", ({ it, assert, beforeEach, beforeAll, afterEach, spy }) => {
	beforeEach(beforeEachCallback(spy));
	beforeAll(beforeAllCallback);
	afterEach(afterEachCallback);

	let multiPaymentTransaction: Interfaces.ITransaction;
	let sendersDelegate: Contracts.State.Wallet;
	let amount: Utils.BigNumber;

	beforeEach(() => {
		sendersDelegate = forgingWallet;
		sendersDelegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

		const sendingWallet: Wallet = factory
			.get("Wallet")
			.withOptions({
				passphrase: "testPassphrase1",
				nonce: 0,
			})
			.make();

		amount = Utils.BigNumber.make(2345);

		multiPaymentTransaction = factory
			.get("MultiPayment")
			.withOptions({
				amount,
				senderPublicKey: sendingWallet.getPublicKey(),
				recipientId: recipientWallet.getAddress(),
			})
			.make();

		// @ts-ignore
		multiPaymentTransaction.data.asset.payments = [
			{
				// @ts-ignore
				amount: [amount],
				recipientId: "D5T4Cjx7khYbwaaCLmi7j3cUdt4GVWqKkG",
			},
			{
				// @ts-ignore
				amount: [amount],
				recipientId: "D5T4Cjx7khYbwaaCLmi7j3cUdt4GVWqKkG",
			},
		];
		// TODO: Why do these need to be set manually here?
		// @ts-ignore
		multiPaymentTransaction.typeGroup = multiPaymentTransaction.data.typeGroup;
		// @ts-ignore
		multiPaymentTransaction.type = multiPaymentTransaction.data.type;

		sendingWallet.setAttribute("vote", sendersDelegate.getPublicKey());
		recipientWallet.setAttribute("vote", recipientsDelegate.getPublicKey());
		walletRepo.index([sendersDelegate, recipientsDelegate, sendingWallet, recipientWallet]);
	});

	it("should fail if there are no assets", async () => {
		sendingWallet.forgetAttribute("vote");
		walletRepo.index([sendingWallet]);

		// @ts-ignore
		delete multiPaymentTransaction.data.asset;

		await assert.rejects(() => blockState.applyTransaction(multiPaymentTransaction));
	});

	it("should fail if there are no assets and sending wallet has voted", async () => {
		// @ts-ignore
		delete multiPaymentTransaction.data.asset;

		await assert.rejects(() => blockState.applyTransaction(multiPaymentTransaction));
	});

	it("should be okay when recipient hasn't voted", async () => {
		recipientWallet.forgetAttribute("vote");
		walletRepo.index([recipientWallet]);

		await assert.resolves(() => blockState.applyTransaction(multiPaymentTransaction));
	});

	it("should update delegates vote balance for multiPayments", async () => {
		const senderDelegateBefore = sendersDelegate.getAttribute("delegate.voteBalance");
		const recipientsDelegateBefore = recipientsDelegate.getAttribute("delegate.voteBalance");

		await blockState.applyTransaction(multiPaymentTransaction);

		assert.equal(
			recipientsDelegate.getAttribute("delegate.voteBalance"),
			recipientsDelegateBefore.plus(amount).times(2),
		);
		assert.equal(
			sendersDelegate.getAttribute("delegate.voteBalance"),
			senderDelegateBefore.minus(amount.times(2).plus(multiPaymentTransaction.data.fee)),
		);

		await blockState.revertTransaction(multiPaymentTransaction);

		assert.equal(recipientsDelegate.getAttribute("delegate.voteBalance"), Utils.BigNumber.ZERO);
		assert.equal(sendersDelegate.getAttribute("delegate.voteBalance"), Utils.BigNumber.ZERO);
	});
});

describe("apply and revert transactions", ({ it, each, assert, beforeEach, beforeAll, afterEach, spy }) => {
	beforeEach(beforeEachCallback(spy));
	beforeAll(beforeAllCallback);
	afterEach(afterEachCallback);

	const factory = new Factories.FactoryBuilder();

	Factories.Factories.registerTransactionFactory(factory);
	Factories.Factories.registerWalletFactory(factory);

	const sender: any = factory
		.get("Wallet")
		.withOptions({
			passphrase: "testPassphrase1",
			nonce: 0,
		})
		.make();

	const recipientWallet: any = factory
		.get("Wallet")
		.withOptions({
			passphrase: "testPassphrase2",
		})
		.make();

	const transfer = factory
		.get("Transfer")
		.withOptions({ amount: 96579, senderPublicKey: sender.publicKey, recipientId: recipientWallet.address })
		.make();

	const delegateReg = factory
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

	const vote = factory
		.get("Vote")
		.withOptions({
			publicKey: recipientWallet.publicKey,
			senderPublicKey: sender.publicKey,
			recipientId: recipientWallet.address,
		})
		.make();

	const delegateRes = factory
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

	for (const transaction of [transfer, delegateReg, vote, delegateRes]) {
		it("should call the transaction handler apply the transaction to the sender & recipient", async () => {
			await blockState.applyTransaction(transaction as ITransaction);

			applySpy.calledWith(transaction);
		});

		it("should call be able to revert the transaction", async () => {
			await blockState.revertTransaction(transaction as ITransaction);

			revertSpy.calledWith(transaction);
		});

		it("not fail to apply transaction if the recipient doesn't exist", async () => {
			// @ts-ignore
			transaction.data.recipientId = "don'tExist";

			forgetWallet(recipientWallet);

			await assert.resolves(() => blockState.applyTransaction(transaction as ITransaction));
		});

		it("not fail to revert transaction if the recipient doesn't exist", async () => {
			// @ts-ignore
			transaction.data.recipientId = "don'tExist";

			forgetWallet(recipientWallet);

			await assert.resolves(() => blockState.revertTransaction(transaction as ITransaction));
		});
	}

	describe("vote", ({ it, assert, beforeEach, beforeAll, afterEach }) => {
		beforeEach(beforeEachCallback(spy));
		beforeAll(beforeAllCallback);
		afterEach(afterEachCallback);

		it("should fail if there are no assets", async () => {
			const voteTransaction = factory
				.get("Vote")
				.withOptions({
					publicKey: recipientWallet.publicKey,
					senderPublicKey: sender.publicKey,
					recipientId: recipientWallet.address,
				})
				.make();

			// @ts-ignore
			delete voteTransaction.data.asset;

			await assert.rejects(() => blockState.applyTransaction(voteTransaction as Interfaces.ITransaction));
		});
	});
});

describe("when 1 transaction fails while reverting it", ({
	it,
	assert,
	beforeEach,
	beforeAll,
	afterEach,
	spy,
	stub,
}) => {
	beforeEach(beforeEachCallback(spy));
	beforeAll(beforeAllCallback);
	afterEach(afterEachCallback);

	it("should apply sequentially (from first to last) all the reverted transactions of the block", async () => {
		const apply = spy(blockState, "applyTransaction");

		const revert = stub(blockState, "revertTransaction").callsFake((tx) => {
			if (tx === blocks[0].transactions[0]) {
				throw new Error("Fake error");
			}
		});

		assert.length(blocks[0].transactions, 3);
		await assert.rejects(() => blockState.revertBlock(blocks[0]));

		apply.calledTimes(2);
		assert.true(applySpy.calledTwice);

		let counter = 0;
		for (const transaction of blocks[0].transactions.slice(1)) {
			apply.calledNthWith(counter++, transaction);
		}

		apply.restore();
		revert.restore();
	});

	it("throws the Error", async () => {
		const revert = stub(blockState, "revertTransaction").callsFake(() => {
			throw new Error("Fake error");
		});

		await assert.rejects(() => blockState.revertBlock(blocks[0]));

		revert.restore();
	});
});

describe("when 1 transaction fails while applying it", ({
	it,
	assert,
	beforeEach,
	beforeAll,
	afterEach,
	spy,
	stub,
}) => {
	beforeEach(beforeEachCallback(spy));
	beforeAll(beforeAllCallback);
	afterEach(afterEachCallback);

	it.only("should revert sequentially (from last to first) all the transactions of the block", async () => {
		const revert = spy(blockState, "revertTransaction");

		const apply = stub(blockState, "applyTransaction").callsFake((tx) => {
			if (tx === blocks[0].transactions[2]) {
				throw new Error("Fake error");
			}
		});

		const lastBlock = stub(stateStore, "getLastBlock").returnValue(blocks[1]);

		assert.length(blocks[0].transactions, 3);
		await assert.rejects(() => blockState.applyBlock(blocks[0]));

		revert.calledTimes(2);
		assert.true(revertSpy.calledTwice);

		for (const transaction of blocks[0].transactions.slice(0, 1)) {
			const i = blocks[0].transactions.slice(0, 1).indexOf(transaction);
			const total = blocks[0].transactions.slice(0, 1).length;

			revert.calledNthWith(total - i, blocks[0].transactions[i]);
		}

		apply.restore();
		revert.restore();
		lastBlock.restore();
	});

	it("throws the Error", async () => {
		const apply = stub(blockState, "applyTransaction").callsFake(() => {
			throw new Error("Fake error");
		});

		await assert.rejects(() => blockState.applyBlock(blocks[0]));

		apply.restore();
	});
});
