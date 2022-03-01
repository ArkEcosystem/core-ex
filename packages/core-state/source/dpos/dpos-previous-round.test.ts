import { Container, Utils } from "@arkecosystem/core-kernel";
import { RoundInfo } from "@arkecosystem/core-kernel/source/contracts/shared";
import { DposPreviousRoundStateProvider } from "@arkecosystem/core-kernel/source/contracts/state";
import { DposState } from "./dpos";
import { WalletRepository } from "../wallets";
import { Interfaces } from "@arkecosystem/crypto";
import { buildDelegateAndVoteWallets } from "../../test/build-delegate-and-vote-balances";
import { makeChainedBlocks } from "../../test/make-chained-block";
import { makeVoteTransactions } from "../../test/make-vote-transactions";
import { addTransactionsToBlock } from "../../test/transactions";
import { setUp } from "../../test/setup";
import { describe } from "@arkecosystem/core-test-framework";

let dposState: DposState;
let dposPreviousRoundStateProv: DposPreviousRoundStateProvider;
let walletRepo: WalletRepository;
let factory;
let blockState;
let stateStore;
let initialEnv;
let round: RoundInfo;
let blocks: Interfaces.IBlock[];

const beforeAllCallback = async () => {
	initialEnv = await setUp();
	dposState = initialEnv.dPosState;
	dposPreviousRoundStateProv = initialEnv.dposPreviousRound;
	walletRepo = initialEnv.walletRepo;
	factory = initialEnv.factory;
	blockState = initialEnv.blockState;
	stateStore = initialEnv.stateStore;
};

const beforeEachCallback = async () => {
	walletRepo.reset();

	round = Utils.roundCalculator.calculateRound(1);

	buildDelegateAndVoteWallets(5, walletRepo);

	dposState.buildVoteBalances();
	dposState.buildDelegateRanking();
	round.maxDelegates = 5;
	dposState.setDelegatesRound(round);

	blocks = makeChainedBlocks(101, factory.get("Block"));
};

describe("dposPreviousRound.getAllDelegates", ({ it, beforeAll, beforeEach, assert }) => {
	beforeAll(beforeAllCallback);
	beforeEach(beforeEachCallback);

	it("should get all delegates", async () => {
		const previousRound = await dposPreviousRoundStateProv([], round);

		assert.equal(previousRound.getAllDelegates(), walletRepo.allByUsername());
	});
});

describe("dposPreviousRound.getRoundDelegates", ({ it, beforeAll, beforeEach, assert }) => {
	beforeAll(beforeAllCallback);
	beforeEach(beforeEachCallback);

	it("should get round delegates", async () => {
		const previousRound = await dposPreviousRoundStateProv([], round);

		assert.containValues(previousRound.getRoundDelegates(), walletRepo.allByUsername() as any);
	});
});

describe("dposPreviousRound.revert", ({ it, beforeAll, beforeEach, spy, stub }) => {
	beforeAll(beforeAllCallback);
	beforeEach(beforeEachCallback);

	it("should revert blocks", async () => {
		const spyBuildDelegateRanking = spy(dposState, "buildDelegateRanking");
		const spySetDelegatesRound = spy(dposState, "setDelegatesRound");
		const spyRevertBlock = spy(blockState, "revertBlock");
		const spyGetLastBlock = stub(stateStore, "getLastBlock").returnValue({
			data: {
				height: 1,
			},
		});

		initialEnv.sandbox.app.rebind(Container.Identifiers.DposState).toConstantValue(dposState);
		initialEnv.sandbox.app.rebind(Container.Identifiers.BlockState).toConstantValue(blockState);
		initialEnv.sandbox.app.rebind(Container.Identifiers.StateStore).toConstantValue(stateStore);

		const generatorWallet = walletRepo.findByPublicKey(blocks[0].data.generatorPublicKey);

		generatorWallet.setAttribute("delegate", {
			username: "test",
			forgedFees: Utils.BigNumber.ZERO,
			forgedRewards: Utils.BigNumber.ZERO,
			producedBlocks: 0,
			lastBlock: undefined,
		});

		walletRepo.index(generatorWallet);

		addTransactionsToBlock(
			makeVoteTransactions(3, [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`]),
			blocks[0],
		);
		blocks[0].data.height = 2;

		await blockState.applyBlock(blocks[0]);

		await dposPreviousRoundStateProv([blocks[0]], round);

		spyGetLastBlock.calledOnce();
		spyBuildDelegateRanking.calledOnce();
		spySetDelegatesRound.calledWith(round);
		spyRevertBlock.calledWith(blocks[0]);
	});

	it("should not revert the blocks when height is one", async () => {
		const spyBuildDelegateRanking = spy(dposState, "buildDelegateRanking");
		const spySetDelegatesRound = spy(dposState, "setDelegatesRound");
		const spyRevertBlock = spy(blockState, "revertBlock");

		initialEnv.sandbox.app.rebind(Container.Identifiers.DposState).toConstantValue(dposState);
		initialEnv.sandbox.app.rebind(Container.Identifiers.BlockState).toConstantValue(blockState);

		blocks[0].data.height = 1;

		await dposPreviousRoundStateProv([blocks[0]], round);

		spyBuildDelegateRanking.calledOnce();
		spySetDelegatesRound.calledOnce();
		spyRevertBlock.neverCalled();
	});
});
