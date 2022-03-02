import { Enums, Utils } from "@arkecosystem/core-kernel";
import { StateBuilder } from "./state-builder";
import { WalletRepository } from "./wallets";
import { Sandbox, describe } from "@arkecosystem/core-test-framework";
import { Managers } from "@arkecosystem/crypto";
import { setUp, setUpDefaults } from "../test/setup";
import { SinonSpy } from "sinon";

let stateBuilder: StateBuilder;
let getBlockRewardsSpy: SinonSpy;
let getSentTransactionSpy: SinonSpy;
let getRegisteredHandlersSpy: SinonSpy;
let dispatchSpy: SinonSpy;

const getBlockRewardsDefault = setUpDefaults.getBlockRewards[0];
const getSentTransactionDefault = setUpDefaults.getSentTransaction[0];

const generatorKey = getBlockRewardsDefault.generatorPublicKey;
const senderKey = getSentTransactionDefault.senderPublicKey;

let sandbox: Sandbox;

let loggerWarningSpy: SinonSpy;
let loggerInfoSpy: SinonSpy;

let walletRepo: WalletRepository;
let restoreDefaultSentTransactions: () => void;

const saveDefaultTransactions = (): (() => void) => {
	const saveTransaction = setUpDefaults.getSentTransaction;
	return () => (setUpDefaults.getSentTransaction = saveTransaction);
};

describe("StateBuilder", ({ it, beforeAll, beforeEach, assert }) => {
	beforeAll(async () => {
		const initialEnv = await setUp();

		walletRepo = initialEnv.walletRepo;
		stateBuilder = initialEnv.stateBuilder;
		sandbox = initialEnv.sandbox;

		getBlockRewardsSpy = initialEnv.spies.getBlockRewardsSpy;
		getSentTransactionSpy = initialEnv.spies.getSentTransactionSpy;
		getRegisteredHandlersSpy = initialEnv.spies.getRegisteredHandlersSpy;
		dispatchSpy = initialEnv.spies.dispatchSpy;
		loggerWarningSpy = initialEnv.spies.logger.warning;
		loggerInfoSpy = initialEnv.spies.logger.info;

		restoreDefaultSentTransactions = saveDefaultTransactions();
	});

	beforeEach(() => {
		walletRepo.reset();

		loggerWarningSpy.resetHistory();
		dispatchSpy.resetHistory();

		sandbox.app.config("crypto.exceptions.negativeBalances", {});

		restoreDefaultSentTransactions();

		// sender wallet balance should always be enough for default transactions (unless it is overridden)
		const wallet = walletRepo.findByPublicKey(senderKey);
		wallet.setBalance(Utils.BigNumber.make(100000));
	});

	it("should call block repository to get initial block rewards", async () => {
		await stateBuilder.run();

		assert.true(getBlockRewardsSpy.called);
	});

	it("should get registered handlers", async () => {
		await stateBuilder.run();

		assert.true(getRegisteredHandlersSpy.called);
	});

	it("should get sent transactions", async () => {
		await stateBuilder.run();

		assert.true(getSentTransactionSpy.called);
	});

	it("should apply block rewards to generator wallet", async () => {
		const wallet = walletRepo.findByPublicKey(generatorKey);
		wallet.setBalance(Utils.BigNumber.ZERO);
		walletRepo.index(wallet);
		const expectedBalance = wallet.getBalance().plus(getBlockRewardsDefault.rewards);

		await stateBuilder.run();

		assert.equal(wallet.getBalance(), expectedBalance);
	});

	it("should apply the transaction data to the sender", async () => {
		const wallet = walletRepo.findByPublicKey(senderKey);
		wallet.setBalance(Utils.BigNumber.make(80000));
		walletRepo.index(wallet);

		const expectedBalance = wallet
			.getBalance()
			.minus(getSentTransactionDefault.amount)
			.minus(getSentTransactionDefault.fee);

		await stateBuilder.run();

		assert.equal(wallet.getNonce(), getSentTransactionDefault.nonce);
		assert.equal(wallet.getBalance(), expectedBalance);
	});

	it("should fail if any wallet balance is negative and not whitelisted", async () => {
		const wallet = walletRepo.findByPublicKey(senderKey);
		wallet.setBalance(Utils.BigNumber.make(-80000));
		wallet.setPublicKey(senderKey);

		walletRepo.index(wallet);

		await stateBuilder.run();

		assert.true(
			loggerWarningSpy.calledWith(
				"Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative balance of '-135555'",
			),
		);
		assert.false(dispatchSpy.called);
	});

	it("should not fail for negative genesis wallet balances", async () => {
		const genesisPublicKeys: string[] = Managers.configManager
			.get("genesisBlock.transactions")
			.reduce((acc, curr) => [...acc, curr.senderPublicKey], []);

		const wallet = walletRepo.findByPublicKey(genesisPublicKeys[0]);
		wallet.setBalance(Utils.BigNumber.make(-80000));
		wallet.setPublicKey(genesisPublicKeys[0]);

		walletRepo.index(wallet);

		await stateBuilder.run();

		assert.false(loggerWarningSpy.called);
		assert.true(dispatchSpy.calledWith(Enums.StateEvent.BuilderFinished));
	});

	it("should not fail if the publicKey is whitelisted", async () => {
		const wallet = walletRepo.findByPublicKey(senderKey);
		wallet.setNonce(getSentTransactionDefault.nonce);
		const allowedWalletNegativeBalance = Utils.BigNumber.make(5555);
		wallet.setBalance(allowedWalletNegativeBalance);
		wallet.setPublicKey(senderKey);
		walletRepo.index(wallet);

		const balance: Record<string, Record<string, string>> = {
			[senderKey]: {
				[wallet.getNonce().toString()]: allowedWalletNegativeBalance.toString(),
			},
		};

		sandbox.app.config("crypto.exceptions.negativeBalances", balance);

		setUpDefaults.getSentTransaction = [];

		await stateBuilder.run();

		assert.false(loggerWarningSpy.called);
		assert.true(dispatchSpy.calledWith(Enums.StateEvent.BuilderFinished));
	});

	it("should fail if the whitelisted key doesn't have the allowed negative balance", async () => {
		const wallet = walletRepo.findByPublicKey(senderKey);
		wallet.setNonce(getSentTransactionDefault.nonce);
		wallet.setBalance(Utils.BigNumber.make(-90000));
		wallet.setPublicKey(senderKey);
		walletRepo.index(wallet);

		const balance: Record<string, Record<string, string>> = {
			[senderKey]: {
				[wallet.getNonce().toString()]: Utils.BigNumber.make(-80000).toString(),
			},
		};

		sandbox.app.config("crypto.exceptions.negativeBalances", balance);

		setUpDefaults.getSentTransaction = [];

		await stateBuilder.run();

		assert.true(
			loggerWarningSpy.calledWith("Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative balance of '-90000'"),
		);
		assert.false(dispatchSpy.called);
	});

	it("should not fail if the whitelisted key has the allowed negative balance", async () => {
		const wallet = walletRepo.findByPublicKey(senderKey);
		wallet.setNonce(getSentTransactionDefault.nonce);
		wallet.setBalance(Utils.BigNumber.make(-90000));
		wallet.setPublicKey(senderKey);
		walletRepo.index(wallet);

		const balance: Record<string, Record<string, string>> = {
			[senderKey]: {
				[wallet.getNonce().toString()]: Utils.BigNumber.make(-90000).toString(),
			},
		};

		sandbox.app.config("crypto.exceptions.negativeBalances", balance);

		setUpDefaults.getSentTransaction = [];

		await stateBuilder.run();

		assert.false(loggerWarningSpy.called);
		assert.true(dispatchSpy.called);
	});

	it("should not fail if delegates vote balance isn't below 0", async () => {
		const wallet = walletRepo.findByPublicKey(senderKey);
		wallet.setBalance(Utils.BigNumber.ZERO);
		walletRepo.index(wallet);
		wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(100));

		setUpDefaults.getSentTransaction = [];

		await stateBuilder.run();

		assert.false(loggerWarningSpy.called);
		assert.true(dispatchSpy.called);
	});

	it("should fail if the wallet has no public key", async () => {
		const wallet = walletRepo.findByPublicKey(senderKey);
		wallet.setNonce(getSentTransactionDefault.nonce);
		wallet.setBalance(Utils.BigNumber.make(-90000));
		// @ts-ignore
		wallet.publicKey = undefined;
		walletRepo.index(wallet);

		const balance: Record<string, Record<string, string>> = {
			[senderKey]: {
				[wallet.getNonce().toString()]: Utils.BigNumber.make(-90000).toString(),
			},
		};

		sandbox.app.config("crypto.exceptions.negativeBalances", balance);

		setUpDefaults.getSentTransaction = [];

		await stateBuilder.run();

		assert.true(
			loggerWarningSpy.calledWith("Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative balance of '-90000'"),
		);
		assert.false(dispatchSpy.called);
	});

	it("should emit an event when the builder is finished", async () => {
		await stateBuilder.run();

		assert.true(dispatchSpy.calledWith(Enums.StateEvent.BuilderFinished));
	});

	it("should exit app if any vote balance is negative", async () => {
		const wallet = walletRepo.findByPublicKey(senderKey);
		wallet.setBalance(Utils.BigNumber.ZERO);
		walletRepo.index(wallet);
		wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(-100));

		setUpDefaults.getSentTransaction = [];

		await stateBuilder.run();

		assert.true(
			loggerWarningSpy.calledWith(
				"Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative vote balance of '-100'",
			),
		);
	});

	it("should capitalise registered handlers", async () => {
		setUpDefaults.getRegisteredHandlers = [
			{
				getConstructor: () => ({
					version: 1,
					key: "test",
				}),
			},
		];

		setUpDefaults.getSentTransaction = [];

		await assert.resolves(() => stateBuilder.run());

		assert.true(loggerInfoSpy.calledWith(`State Generation - Step 3 of 4: Test v1`));
	});
});
