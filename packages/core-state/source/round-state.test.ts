import { Container, Enums } from "@arkecosystem/core-kernel";
import { RoundState } from "./round-state";
import { Blocks, Identities, Utils } from "@arkecosystem/crypto";
import { Sandbox, describe } from "@arkecosystem/core-test-framework";
import block1760000 from "../test/fixtures/block1760000";

let sandbox: Sandbox;
let roundState: RoundState;

let databaseService;
let dposState;
let getDposPreviousRoundState;
let stateStore;
let walletRepository;
let triggerService;
let eventDispatcher;
let logger;

const beforeEachCallback = () => {
	databaseService = {
		getLastBlock: () => undefined,
		getBlocks: () => undefined,
		getRound: () => undefined,
		saveRound: () => undefined,
		deleteRound: () => undefined,
	};
	dposState = {
		buildDelegateRanking: () => undefined,
		setDelegatesRound: () => undefined,
		getRoundDelegates: () => undefined,
	};
	getDposPreviousRoundState = () => undefined;
	stateStore = {
		setGenesisBlock: () => undefined,
		getGenesisBlock: () => undefined,
		setLastBlock: () => undefined,
		getLastBlock: () => undefined,
		getLastBlocksByHeight: () => undefined,
		getCommonBlocks: () => undefined,
		getLastBlockIds: () => undefined,
	};
	walletRepository = {
		createWallet: () => undefined,
		findByPublicKey: () => undefined,
		findByUsername: () => undefined,
	};
	triggerService = {
		call: () => undefined,
	};
	eventDispatcher = {
		call: () => undefined,
		dispatch: () => undefined,
	};
	logger = {
		error: () => undefined,
		warning: () => undefined,
		info: () => undefined,
		debug: () => undefined,
	};

	sandbox = new Sandbox();

	sandbox.app.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);
	sandbox.app.bind(Container.Identifiers.DposState).toConstantValue(dposState);
	sandbox.app.bind(Container.Identifiers.DposPreviousRoundStateProvider).toConstantValue(getDposPreviousRoundState);
	sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
	sandbox.app.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);
	sandbox.app.bind(Container.Identifiers.TriggerService).toConstantValue(triggerService);
	sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcher);
	sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

	roundState = sandbox.app.resolve<RoundState>(RoundState);
};

const generateBlocks = (count: number): any[] => {
	const blocks: any[] = [];

	for (let i = 1; i <= count; i++) {
		blocks.push({
			data: {
				height: i,
				id: "id_" + i,
				generatorPublicKey: "public_key_" + i,
			},
		} as any);
	}

	return blocks;
};

const generateDelegates = (count: number): any[] => {
	const delegates: any[] = [];

	for (let i = 1; i <= count; i++) {
		const delegate: any = {
			getPublicKey: () => {
				return "public_key_" + i;
			},
			username: "username_" + i,
			getAttribute: (key) => {
				return key === "delegate.username" ? "username_" + i : i;
			},
			setAttribute: () => undefined,
		};
		delegate.clone = () => {
			return delegate;
		};
		delegates.push(delegate);
	}

	return delegates;
};

describe("getBlocksForRound", ({ it, assert, beforeEach, spy, stub }) => {
	let blocks: any[];

	beforeEach(beforeEachCallback);

	beforeEach(() => {
		blocks = generateBlocks(3);
	});

	it("should return array of blocks when all requested blocks are in stateStore", async () => {
		const lastBlock = blocks[2];

		const stateStoreStub = stub(stateStore, "getLastBlock").returnValue(lastBlock);
		const stateStoreStub2 = stub(stateStore, "getLastBlocksByHeight").returnValue(blocks);

		const spyOnFromData = stub(Blocks.BlockFactory, "fromData").callsFake((block) => {
			return block;
		});

		// @ts-ignore
		assert.equal(await roundState.getBlocksForRound(), blocks);

		stateStoreStub2.calledWith(1, 3);
		spyOnFromData.calledTimes(3);

		stateStoreStub.restore();
		stateStoreStub2.restore();
		spyOnFromData.restore();
	});

	it("should return array of blocks when only last block is in stateStore", async () => {
		const lastBlock = blocks[2];

		const stateStoreStub = stub(stateStore, "getLastBlock").returnValue(lastBlock);
		const stateStoreStub2 = stub(stateStore, "getLastBlocksByHeight").returnValue([lastBlock]);
		const databaseServiceStub = stub(databaseService, "getBlocks").returnValue(blocks.slice(0, 2));

		const spyOnFromData = stub(Blocks.BlockFactory, "fromData").callsFake((block) => {
			return block;
		});

		// @ts-ignore
		assert.equal(await roundState.getBlocksForRound(), blocks);

		stateStoreStub2.calledWith(1, 3);
		databaseServiceStub.calledWith(1, 2);
		spyOnFromData.calledTimes(3);

		stateStoreStub.restore();
		stateStoreStub2.restore();
		spyOnFromData.restore();
		databaseServiceStub.restore();
	});
});

describe("getActiveDelegates", ({ it, assert, beforeEach, spy, stub, stubFn }) => {
	beforeEach(beforeEachCallback);

	it("should return shuffled round delegates", async () => {
		const lastBlock = Blocks.BlockFactory.fromData(block1760000);

		const stateStub = stub(stateStore, "getLastBlock").returnValue(lastBlock);

		const delegatePublicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
		const delegateVoteBalance = Utils.BigNumber.make("100");
		const roundDelegateModel = { publicKey: delegatePublicKey, balance: delegateVoteBalance };

		const dbStub = stub(databaseService, "getRound").returnValueOnce([roundDelegateModel]);

		const cloneStub = stubFn();
		const setAttributeStub = stubFn();

		const newDelegateWallet = {
			setAttribute: setAttributeStub,
			clone: cloneStub,
			setPublicKey: () => {},
		};
		const walletRepoStub1 = stub(walletRepository, "createWallet").returnValue(newDelegateWallet);

		const getAttributeStub = stubFn();
		const oldDelegateWallet = { getAttribute: getAttributeStub };
		const walletRepoStub2 = stub(walletRepository, "findByPublicKey").returnValue(oldDelegateWallet);

		const delegateUsername = "test_delegate";
		getAttributeStub.onFirstCall().returns(delegateUsername);

		const cloneDelegateWallet = {};
		cloneStub.onFirstCall().returns(cloneDelegateWallet);

		const spyOnShuffleDelegates = spy(roundState, "shuffleDelegates");

		await roundState.getActiveDelegates();

		walletRepoStub2.calledWith(delegatePublicKey);
		walletRepoStub1.calledWith(Identities.Address.fromPublicKey(delegatePublicKey));
		assert.true(oldDelegateWallet.getAttribute.calledWith("delegate.username"));
		assert.true(
			newDelegateWallet.setAttribute.calledWith("delegate", {
				voteBalance: delegateVoteBalance,
				username: delegateUsername,
				round: 34510,
			}),
		);
		assert.true(cloneStub.called);
		spyOnShuffleDelegates.called();
	});

	it("should return cached forgingDelegates when round is the same", async () => {
		const spied = spy();
		const forgingDelegate = { getAttribute: spied };
		const forgingDelegateRound = 2;

		const getAttributeStub = stub(forgingDelegate, "getAttribute").returnValueOnce(forgingDelegateRound);

		// @ts-ignore
		roundState.forgingDelegates = [forgingDelegate] as any;

		const roundInfo = { round: 2 };
		const result = await roundState.getActiveDelegates(roundInfo as any);

		getAttributeStub.calledWith("delegate.round");
		// @ts-ignore
		assert.equal(result, roundState.forgingDelegates);

		getAttributeStub.restore();
	});
});

describe("setForgingDelegatesOfRound", ({ it, assert, beforeEach, spy, stub }) => {
	beforeEach(beforeEachCallback);

	it("should call getActiveDelegates and set forgingDelegatesOfRound", async () => {
		const delegate = {
			username: "dummy_delegate",
		};

		const triggerStub = stub(triggerService, "call").returnValue([delegate]);

		const roundInfo = { round: 2, roundHeight: 2, nextRound: 3, maxDelegates: 51 };
		// @ts-ignore
		await roundState.setForgingDelegatesOfRound(roundInfo, [delegate]);

		triggerStub.calledWith("getActiveDelegates", {
			delegates: [delegate],
			roundInfo,
		});

		// @ts-ignore
		assert.equal(roundState.forgingDelegates, [delegate]);
	});

	it("should call getActiveDelegates and set forgingDelegatesOfRound to [] if undefined is returned", async () => {
		const delegate = {
			username: "dummy_delegate",
		};
		const triggerStub = stub(triggerService, "call").returnValue(undefined);

		const roundInfo = { round: 2, roundHeight: 2, nextRound: 3, maxDelegates: 51 };
		// @ts-ignore
		await roundState.setForgingDelegatesOfRound(roundInfo, [delegate]);

		triggerStub.calledWith("getActiveDelegates", {
			delegates: [delegate],
			roundInfo,
		});

		// @ts-ignore
		assert.equal(roundState.forgingDelegates, []);
	});
});

describe("detectMissedBlocks", ({ it, assert, beforeEach, spy, stub }) => {
	beforeEach(beforeEachCallback);

	const genesisBlocks = {
		data: {
			height: 1,
		},
	};
	let delegates: any[];

	beforeEach(() => {
		delegates = generateDelegates(51);
		// @ts-ignore
		roundState.forgingDelegates = delegates;
	});

	it("should not detect missed round when stateStore.lastBlock is genesis block", async () => {
		const block = {
			data: {
				height: 2,
			},
		};

		const stateStoreStub = stub(stateStore, "getLastBlock").returnValue(genesisBlocks);
		const loggerSpy = spy(logger, "debug");
		const eventSpy = spy(eventDispatcher, "dispatch");

		await roundState.detectMissedBlocks(block as any);

		loggerSpy.neverCalled();
		eventSpy.neverCalled();
	});

	it("should not detect missed block if slots are sequential", async () => {
		const block1 = {
			data: {
				height: 2,
				timestamp: 8,
			},
		};

		const stateStoreStub = stub(stateStore, "getLastBlock").returnValue(block1);
		const loggerSpy = spy(logger, "debug");
		const eventSpy = spy(eventDispatcher, "dispatch");

		const block2 = {
			data: {
				height: 3,
				timestamp: 2 * 8,
			},
		};
		await roundState.detectMissedBlocks(block2 as any);

		loggerSpy.neverCalled();
		eventSpy.neverCalled();
	});

	it("should detect missed block if slots are not sequential", async () => {
		const block1 = {
			data: {
				height: 2,
				timestamp: 8,
			},
		};

		const stateStoreStub = stub(stateStore, "getLastBlock").returnValue(block1);
		const loggerSpy = spy(logger, "debug");
		const eventSpy = spy(eventDispatcher, "dispatch");

		const block2 = {
			data: {
				height: 3,
				timestamp: 3 * 8,
			},
		};
		await roundState.detectMissedBlocks(block2 as any);

		loggerSpy.calledOnce();
		eventSpy.calledOnce();
		eventSpy.calledWith(Enums.ForgerEvent.Missing, {
			delegate: delegates[2],
		});
	});

	it("should detect only one round if multiple rounds are missing", async () => {
		const block1 = {
			data: {
				height: 2,
				timestamp: 8,
			},
		};

		const stateStoreStub = stub(stateStore, "getLastBlock").returnValue(block1);
		const loggerSpy = spy(logger, "debug");
		const eventSpy = spy(eventDispatcher, "dispatch");

		const block2 = {
			data: {
				height: 3,
				timestamp: 102 * 8,
			},
		};
		await roundState.detectMissedBlocks(block2 as any);

		loggerSpy.calledTimes(51);
		eventSpy.calledTimes(51);
	});
});

describe("detectMissedRound", ({ it, assert, beforeEach, spy, stub }) => {
	beforeEach(beforeEachCallback);

	let delegates: any[];
	let blocksInCurrentRound: any[];

	beforeEach(() => {
		delegates = generateDelegates(3);
		// @ts-ignore
		roundState.forgingDelegates = delegates;
		blocksInCurrentRound = generateBlocks(3);

		walletRepository.findByPublicKey = (publicKey) => {
			return delegates.find((delegate) => delegate.getPublicKey() === publicKey);
		};
	});

	it("should not detect missed round if all delegates forged blocks", () => {
		// @ts-ignore
		roundState.blocksInCurrentRound = blocksInCurrentRound;

		const loggerSpy = spy(logger, "debug");
		const eventSpy = spy(eventDispatcher, "dispatch");

		// @ts-ignore
		roundState.detectMissedRound();

		loggerSpy.neverCalled();
		eventSpy.neverCalled();
	});

	it("should detect missed round", () => {
		blocksInCurrentRound[2].data.generatorPublicKey = "public_key_1";

		const loggerSpy = spy(logger, "debug");
		const eventSpy = spy(eventDispatcher, "dispatch");

		// @ts-ignore
		roundState.blocksInCurrentRound = blocksInCurrentRound;

		// @ts-ignore
		roundState.detectMissedRound();

		loggerSpy.calledOnce();
		eventSpy.calledWith(Enums.RoundEvent.Missed, { delegate: delegates[2] });
	});
});

describe("applyRound", ({ it, assert, beforeEach, spy, stub, stubFn }) => {
	beforeEach(beforeEachCallback);

	it("should build delegates, save round, dispatch events when height is 1", async () => {
		const eventStub = spy(eventDispatcher, "dispatch");
		const databaseServiceSpy = spy(databaseService, "saveRound");
		const dposStateBuildSpy = spy(dposState, "buildDelegateRanking");
		const dposStateSetSpy = spy(dposState, "setDelegatesRound");

		const forgingDelegate = {
			getAttribute: () => undefined,
			getPublicKey: () => undefined,
		};

		const forgingDelegateRound = 1;

		const getAttributeStub = stubFn().onFirstCall().returns(forgingDelegateRound);
		// @ts-ignore
		roundState.forgingDelegates = [forgingDelegate] as any;

		// @ts-ignore
		roundState.blocksInCurrentRound = [];

		const getAttributeStub2 = stubFn();

		const delegateWallet = {
			getPublicKey: () => "delegate public key",
			getAttribute: getAttributeStub2,
		};

		const dposStateRoundDelegates = [delegateWallet];
		const dposGetStub = stub(dposState, "getRoundDelegates");

		dposGetStub.returnValue(dposStateRoundDelegates);

		const delegateWalletRound = 1;
		getAttributeStub2.onFirstCall().returns(delegateWalletRound);

		const walletRepoStub = stub(walletRepository, "findByPublicKey").returnValueOnce(delegateWallet);

		const delegateUsername = "test_delegate";
		getAttributeStub2.onSecondCall().returns(delegateUsername);

		const height = 1;
		// @ts-ignore
		await roundState.applyRound(height);

		dposStateBuildSpy.called();
		dposStateSetSpy.calledWith({
			round: 1,
			nextRound: 1,
			roundHeight: 1,
			maxDelegates: 51,
		});
		databaseServiceSpy.calledWith(dposStateRoundDelegates);
		eventStub.calledWith("round.applied");
	});

	it("should build delegates, save round, dispatch events, and skip missing round checks when first round has genesis block only", async () => {
		const eventStub = spy(eventDispatcher, "dispatch");
		const databaseServiceSpy = spy(databaseService, "saveRound");
		const dposStateBuildSpy = spy(dposState, "buildDelegateRanking");
		const dposStateSetSpy = spy(dposState, "setDelegatesRound");

		const forgingDelegateRound = 1;

		const getAttributeStub = stubFn().returns(forgingDelegateRound);

		const forgingDelegate = {
			getAttribute: getAttributeStub,
			getPublicKey: () => undefined,
		};

		// @ts-ignore
		roundState.forgingDelegates = [forgingDelegate] as any;

		// @ts-ignore
		roundState.blocksInCurrentRound = [{ data: { height: 1 } }] as any;

		const getAttributeStub2 = stubFn();

		const delegateWallet = { publicKey: "delegate public key", getAttribute: getAttributeStub2 };
		const dposStateRoundDelegates = [delegateWallet];

		const dposGetStub = stub(dposState, "getRoundDelegates");

		dposGetStub.returnValue(dposStateRoundDelegates);

		const delegateWalletRound = 2;

		getAttributeStub2.onFirstCall().returns(delegateWalletRound);

		const walletRepoStub = stub(walletRepository, "findByPublicKey").returnValueOnce(delegateWallet);

		const delegateUsername = "test_delegate";
		getAttributeStub2.onSecondCall().returns(delegateUsername);

		const height = 51;
		// @ts-ignore
		await roundState.applyRound(height);

		dposStateBuildSpy.called();
		dposStateSetSpy.calledWith({
			round: 2,
			nextRound: 2,
			roundHeight: 52,
			maxDelegates: 51,
		});
		databaseServiceSpy.calledWith(dposStateRoundDelegates);
		eventStub.calledWith("round.applied");
	});

	it("should do nothing when next height is same round", async () => {
		const loggerSpy = spy(logger, "info");

		// @ts-ignore
		await roundState.applyRound(50);

		loggerSpy.neverCalled();
	});
});

describe("applyBlock", ({ it, assert, beforeEach, spy, stub }) => {
	beforeEach(beforeEachCallback);

	let delegates: any[];

	beforeEach(() => {
		delegates = generateDelegates(51);
		// @ts-ignore
		roundState.forgingDelegates = delegates;
	});

	it("should push block to blocksInCurrentRound and skip applyRound when block is not last block in round", async () => {
		const block = {
			data: {
				height: 52, // First block in round 2
			},
		};

		const databaseServiceSpy = spy(databaseService, "saveRound");

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound, []);

		await roundState.applyBlock(block as any);

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound, [block]);
		databaseServiceSpy.neverCalled();
	});

	it("should push block to blocksInCurrentRound, applyRound, check missing round, calculate delegates, and clear blocksInCurrentRound when block is last in round", async () => {
		// @ts-ignore
		roundState.blocksInCurrentRound = generateBlocks(50);

		const block = {
			data: {
				height: 51, // Last block in round 1
				generatorPublicKey: "public_key_51",
			},
		};

		const databaseServiceSpy = spy(databaseService, "saveRound");
		const eventSpy = spy(eventDispatcher, "dispatch");

		const dposGetStub = stub(dposState, "getRoundDelegates").returnValue(delegates);
		const triggerStub = stub(triggerService, "call").callsFake((name, args) => {
			return roundState.getActiveDelegates(args.roundInfo, args.delegates);
		});

		const spyOnShuffleDelegates = spy(roundState, "shuffleDelegates");
		const spyOnDetectMissedRound = spy(roundState, "detectMissedRound");

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound.length, 50);

		await roundState.applyBlock(block as any);

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound, []);
		databaseServiceSpy.called();
		eventSpy.calledWith(Enums.RoundEvent.Applied);
		spyOnShuffleDelegates.called();
		spyOnDetectMissedRound.called();

		eventSpy.notCalledWith(Enums.RoundEvent.Missed);
	});

	// TODO: Check how we can restore
	it("should throw error if databaseService.saveRound throws error", async () => {
		// @ts-ignore
		roundState.blocksInCurrentRound = generateBlocks(50);

		const block = {
			data: {
				height: 51, // Last block in round 1
				generatorPublicKey: "public_key_51",
			},
		};

		const eventSpy = spy(eventDispatcher, "dispatch");

		const dposGetStub = stub(dposState, "getRoundDelegates").returnValue(delegates);
		const triggerStub = stub(triggerService, "call").callsFake((name, args) => {
			return roundState.getActiveDelegates(args.roundInfo, args.delegates);
		});

		const spyOnShuffleDelegates = spy(roundState, "shuffleDelegates");
		const spyOnDetectMissedRound = spy(roundState, "detectMissedRound");

		const databaseServiceSpy = stub(databaseService, "saveRound").callsFake(() => {
			throw new Error("Cannot save round");
		});

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound.length, 50);

		await assert.rejects(() => roundState.applyBlock(block as any));

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound.length, 51);
		databaseServiceSpy.called();
		eventSpy.neverCalled();
		spyOnShuffleDelegates.called();
		spyOnDetectMissedRound.called();

		eventSpy.notCalledWith(Enums.RoundEvent.Missed);
	});

	// TODO: Check genesisBlock if required
});

describe("revertBlock", ({ it, assert, beforeEach, spy, stub, stubFn }) => {
	beforeEach(beforeEachCallback);

	it("should remove last block from blocksInCurrentRound when block is in the same round", async () => {
		const block = {
			data: {
				height: 52, // First block of round 2
			},
		} as any;

		const databaseServiceSpy = spy(databaseService, "deleteRound");

		// @ts-ignore
		roundState.blocksInCurrentRound = [block];

		await roundState.revertBlock(block);

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound, []);
		databaseServiceSpy.neverCalled();
	});

	it("should restore previous round, load previousRoundBlocks and delegates, remove last round from DB and remove last block from blocksInCurrentRound if block is last in round", async () => {
		const blocksInPreviousRound: any[] = generateBlocks(51);
		const delegates: any[] = generateDelegates(51);

		const spyOnFromData = stub(Blocks.BlockFactory, "fromData").callsFake((block) => {
			return block;
		});

		const databaseServiceSpy = spy(databaseService, "deleteRound");

		const block = blocksInPreviousRound[50];

		const stateStub1 = stub(stateStore, "getLastBlocksByHeight").returnValue(blocksInPreviousRound);
		const stateStub2 = stub(stateStore, "getLastBlock").returnValue(block);

		getDposPreviousRoundState = stubFn().returns({
			getAllDelegates: () => delegates,
			getActiveDelegates: () => delegates,
			getRoundDelegates: () => delegates,
		});

		const spyOnCalcPreviousActiveDelegates = stub(roundState, "calcPreviousActiveDelegates").returnValue(delegates);

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound, []);

		await roundState.revertBlock(block);

		spyOnCalcPreviousActiveDelegates.calledOnce();
		spyOnFromData.calledTimes(51);
		databaseServiceSpy.calledWith(2);
		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound.length, 50);
	});

	it("should throw error if databaseService throws error", async () => {
		const blocksInPreviousRound: any[] = generateBlocks(51);
		const delegates: any[] = generateDelegates(51);

		const spyOnFromData = stub(Blocks.BlockFactory, "fromData").callsFake((block) => {
			return block;
		});

		const block = blocksInPreviousRound[50];

		const stateStub1 = stub(stateStore, "getLastBlocksByHeight").returnValue(blocksInPreviousRound);
		const stateStub2 = stub(stateStore, "getLastBlock").returnValue(block);

		getDposPreviousRoundState = stubFn().returns({
			getAllDelegates: () => delegates,
			getActiveDelegates: () => delegates,
			getRoundDelegates: () => delegates,
		});

		const spyOnCalcPreviousActiveDelegates = stub(roundState, "calcPreviousActiveDelegates").returnValue(delegates);

		const databaseServiceSpy = stub(databaseService, "deleteRound").callsFake(() => {
			throw new Error("Database error");
		});

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound, []);

		await assert.rejects(() => roundState.revertBlock(block));

		spyOnCalcPreviousActiveDelegates.calledOnce();
		spyOnFromData.calledTimes(51);
		databaseServiceSpy.calledWith(2);
		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound.length, 51);
	});

	it("should throw error if last blocks is not equal to block", async () => {
		const blocks = generateBlocks(2);

		const dbSpy = spy(databaseService, "deleteRound");
		const stateSpy = spy(stateStore, "getLastBlocksByHeight");

		// @ts-ignore
		roundState.blocksInCurrentRound = [blocks[0]];

		await assert.rejects(() => roundState.revertBlock(blocks[1]));

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound, [blocks[0]]);
		dbSpy.neverCalled();
		stateSpy.neverCalled();
	});
});

describe("restore", ({ it, assert, beforeEach, spy, stub }) => {
	it("should restore blocksInCurrentRound and forgingDelegates when last block in middle of round", async () => {
		const delegates: any[] = generateDelegates(51);
		const blocks: any[] = generateBlocks(3);

		const lastBlock = blocks[2];

		const getLastBlockStub = stub(stateStore, "getLastBlock").returnValue(lastBlock);
		const getLastBlocksByHeightHeight = stub(stateStore, "getLastBlocksByHeight").returnValue(blocks);
		const databaseServiceSpy = spy(databaseService, "deleteRound");

		// @ts-ignore
		const spyOnFromData = stub(Blocks.BlockFactory, "fromData").callsFake((block) => {
			return block;
		});

		const triggerStub = stub(triggerService, "call").returnValue(delegates);

		await roundState.restore();

		spyOnFromData.calledTimes(3);
		databaseServiceSpy.calledWith(2);

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound, blocks);
		// @ts-ignore
		assert.equal(roundState.forgingDelegates, delegates);
	});

	it("should restore blocksInCurrentRound and forgingDelegates when last block is lastBlock of round", async () => {
		const delegates: any[] = generateDelegates(51);
		const blocks: any[] = generateBlocks(51);

		const lastBlock = blocks[50];

		const eventSpy = spy(eventDispatcher, "dispatch");
		const stateStoreStub = stub(stateStore, "getLastBlock").returnValue(lastBlock);
		const stateStoreStub2 = stub(stateStore, "getLastBlocksByHeight").returnValue(blocks);
		const dposStub = stub(dposState, "getRoundDelegates").returnValue(delegates);
		const triggerStub = stub(triggerService, "call").returnValue(delegates);

		const spyOnFromData = stub(Blocks.BlockFactory, "fromData").callsFake((block) => {
			return block;
		});

		const dbDeleteSpy = spy(databaseService, "deleteRound");
		const dbSaveSpy = spy(databaseService, "saveRound");

		await roundState.restore();

		dbDeleteSpy.calledWith(2);
		dbSaveSpy.calledWith(delegates);
		spyOnFromData.calledTimes(51);

		eventSpy.calledWith(Enums.RoundEvent.Applied);

		// @ts-ignore
		assert.equal(roundState.blocksInCurrentRound, []);
		// @ts-ignore
		assert.equal(roundState.forgingDelegates, delegates);
	});

	it("should throw if databaseService throws error", async () => {
		const delegates: any[] = generateDelegates(51);
		const blocks: any[] = generateBlocks(51);

		const lastBlock = blocks[50];

		const stateStoreStub = stub(stateStore, "getLastBlock").returnValue(lastBlock);
		const stateStoreStub2 = stub(stateStore, "getLastBlocksByHeight").returnValue(blocks);
		const dposStub = stub(dposState, "getRoundDelegates").returnValue(delegates);
		const triggerStub = stub(triggerService, "call").returnValue(delegates);

		const spyOnFromData = stub(Blocks.BlockFactory, "fromData").callsFake((block) => {
			return block;
		});

		const dbStub = stub(databaseService, "deleteRound").callsFake(() => {
			throw new Error("Database error");
		});

		await assert.rejects(() => roundState.restore());

		dbStub.calledWith(2);
	});
});

describe("calcPreviousActiveDelegates", ({ it, assert, beforeEach, spy, stub, stubFn }) => {
	beforeEach(beforeEachCallback);

	it("should return previous active delegates && set ranks", async () => {
		const delegates = generateDelegates(51);
		const blocks = generateBlocks(51);

		stub(roundState, "getDposPreviousRoundState").returnValue({
			getAllDelegates: () => delegates,
			getActiveDelegates: () => delegates,
			getRoundDelegates: () => delegates,
		});

		const setAttributeSpy = spy(delegates[0], "setAttribute");
		const walletRepoStub = stub(walletRepository, "findByUsername").callsFake((username) => {
			return delegates.find((delegate) => delegate.username === username);
		});

		const roundInfo: any = { round: 1 };
		// @ts-ignore
		assert.equal(await roundState.calcPreviousActiveDelegates(roundInfo, blocks), delegates);

		walletRepoStub.calledTimes(51);
		setAttributeSpy.calledWith("delegate.rank", 1);
		setAttributeSpy.calledOnce();
	});
});
