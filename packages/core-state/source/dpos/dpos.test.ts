import { Utils, Contracts } from "@arkecosystem/core-kernel";
import { DposState } from "./dpos";
import { WalletRepository } from "../wallets";
import { Utils as CryptoUtils } from "@arkecosystem/crypto/source";
import { SATOSHI } from "@arkecosystem/crypto/source/constants";
import { buildDelegateAndVoteWallets } from "../../test/build-delegate-and-vote-balances";
import { setUp } from "../../test/setup";
import { SinonSpy } from "sinon";
import { describe } from "@arkecosystem/core-test-framework";

let dposState: DposState;
let walletRepo: WalletRepository;
let debugLogger: SinonSpy;
let round: Contracts.Shared.RoundInfo;

describe("dpos", ({ it, beforeAll, beforeEach, assert, skip }) => {
	beforeAll(async () => {
		const initialEnv = await setUp();
		dposState = initialEnv.dPosState;
		walletRepo = initialEnv.walletRepo;
		debugLogger = initialEnv.spies.logger.debug;
	});

	beforeEach(() => {
		walletRepo.reset();

		buildDelegateAndVoteWallets(5, walletRepo);
	});

	skip("buildVoteBalances", () => {
		it("should update delegate votes of htlc locked balances", async () => {
			dposState.buildVoteBalances();

			const delegates = walletRepo.allByUsername();

			for (let i = 0; i < 5; i++) {
				const delegate = delegates[4 - i];
				const total = CryptoUtils.BigNumber.make(5 - i)
						.times(1000)
						.times(SATOSHI);

				assert.equal(delegate.getAttribute<CryptoUtils.BigNumber>("delegate.voteBalance"), total);
			}
		});
	});
});

describe("buildDelegateRanking", ({ it, assert, beforeAll, beforeEach }) => {
	beforeAll(async () => {
		const initialEnv = await setUp();
		dposState = initialEnv.dPosState;
		walletRepo = initialEnv.walletRepo;
		debugLogger = initialEnv.spies.logger.debug;
	});

	beforeEach(() => {
		walletRepo.reset();

		buildDelegateAndVoteWallets(5, walletRepo);
	});
	
	it("should build ranking and sort delegates by vote balance", async () => {
		dposState.buildVoteBalances();
		dposState.buildDelegateRanking();

		const delegates = dposState.getActiveDelegates();

		for (let i = 0; i < 5; i++) {
			const delegate = delegates[i];
			const total = CryptoUtils.BigNumber.make((5 - i) * 1000 * SATOSHI);

			assert.equal(delegate.getAttribute<number>("delegate.rank"), i + 1);
			assert.equal(delegate.getAttribute<CryptoUtils.BigNumber>("delegate.voteBalance"), total);
		}
	});

	it("should throw if two wallets have the same public key", () => {
		const delegates = buildDelegateAndVoteWallets(5, walletRepo);
		delegates[0].setAttribute("delegate.resigned", true);

		delegates[1].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));
		delegates[2].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));
		delegates[1].setPublicKey("03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece");
		delegates[2].setPublicKey("03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece");
		walletRepo.index(delegates[2]);

		assert.throws(
			() => dposState.buildDelegateRanking(), 
			'The balance and public key of both delegates are identical! Delegate "delegate2" appears twice in the list.',
		);
	});

	it("should not throw if public keys are different and balances are the same", () => {
		const delegates = buildDelegateAndVoteWallets(5, walletRepo);

		delegates[1].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));
		delegates[2].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));

		assert.not.throws(() => dposState.buildDelegateRanking());
		assert.equal(delegates[1].getAttribute("delegate.rank"), 1);
		assert.equal(delegates[2].getAttribute("delegate.rank"), 2);
		assert.equal(delegates[0].getAttribute("delegate.rank"), 3);
	});
});

describe("setDelegatesRound", ({ it, assert, beforeAll, beforeEach }) => {
	beforeAll(async () => {
		const initialEnv = await setUp();
		dposState = initialEnv.dPosState;
		walletRepo = initialEnv.walletRepo;
		debugLogger = initialEnv.spies.logger.debug;
	});

	beforeEach(() => {
		walletRepo.reset();

		buildDelegateAndVoteWallets(5, walletRepo);
	});

	it("should throw if there are not enough delegates", () => {
		dposState.buildVoteBalances();
		dposState.buildDelegateRanking();
		const round = Utils.roundCalculator.calculateRound(1);

		assert.throws(
			() => dposState.setDelegatesRound(round),
			`Expected to find 51 delegates but only found 5.This indicates an issue with the genesis block & delegates`
		);
	});

	it("should set the delegates of a round", () => {
		dposState.buildVoteBalances();
		dposState.buildDelegateRanking();
		const round = Utils.roundCalculator.calculateRound(1);
		round.maxDelegates = 4;
		dposState.setDelegatesRound(round);
		const delegates = dposState.getActiveDelegates();
		const roundDelegates = dposState.getRoundDelegates();

		assert.equal(dposState.getRoundInfo(), round);
		assert.equal(roundDelegates, delegates.slice(0, 4));

		for (let i = 0; i < round.maxDelegates; i++) {
			const delegate = walletRepo.findByPublicKey(roundDelegates[i].getPublicKey()!);

			assert.equal(delegate.getAttribute("delegate.round"), round.round);
		}

		// TODO: when we remove Assertion checks, this won't throw
		// instead it should not.toEqual(round)
		assert.throws(() => delegates[4].getAttribute("delegate.round"));
		assert.true(debugLogger.calledWith("Loaded 4 active delegates"));
	});
});

describe("getters", ({ it, beforeEach, assert }) => {
	beforeEach(() => {
		dposState.buildVoteBalances();
		dposState.buildDelegateRanking();
		round = Utils.roundCalculator.calculateRound(1);
		round.maxDelegates = 5;
		dposState.setDelegatesRound(round);
	});

	it("getRoundInfo", () => {
		assert.equal(dposState.getRoundInfo(), round);
	});

	it("getAllDelegates", () => {
		assert.equal(dposState.getAllDelegates(), walletRepo.allByUsername());
	});

	it("getActiveDelegates", () => {
		assert.containValues(dposState.getActiveDelegates(), walletRepo.allByUsername() as any);
	});

	it("getRoundDelegates", () => {
		assert.containValues(dposState.getRoundDelegates(), walletRepo.allByUsername() as any);
	});
});
