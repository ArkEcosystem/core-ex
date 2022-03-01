import { Container } from "@arkecosystem/core-kernel";
import { StateStore } from "./";
import { Factories } from "@arkecosystem/core-test-framework";
import { IBlock, IBlockData, ITransactionData } from "@arkecosystem/crypto/distribution/interfaces";
import { makeChainedBlocks } from "../../test/make-chained-block";
import { setUp } from "../../test/setup";
import Sinon, { SinonSpy } from "sinon";
import { describe } from "@arkecosystem/core-test-framework";

let blocks: IBlock[];
let stateStorage: StateStore;
let factory: Factories.FactoryBuilder;
let logger: SinonSpy;
let dispatchSpy: SinonSpy;

const beforeEachCallback = async () => {
	const initialEnv = await setUp();

	factory = initialEnv.factory;
	logger = initialEnv.spies.logger.info;
	dispatchSpy = initialEnv.spies.dispatchSpy;
	stateStorage = initialEnv.sandbox.app.get(Container.Identifiers.StateStore);

	blocks = makeChainedBlocks(101, factory.get("Block"));
};

describe("getBlockchain", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return initial state", () => {
		assert.equal(stateStorage.getBlockchain(), {});
	});
});

describe("setBlockchain", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should set blockchain state", () => {
		const state = {
			value: "dummy_state",
		};

		stateStorage.setBlockchain(state);
		assert.equal(stateStorage.getBlockchain(), state);
	});
});

describe("isStarted", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should be false by default", () => {
		assert.false(stateStorage.isStarted());
	});
});

describe("setStarted", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should set value", () => {
		stateStorage.setStarted(true);

		assert.true(stateStorage.isStarted());
	});
});

describe("getForkedBlock", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should be undefined by default", () => {
		assert.undefined(stateStorage.getForkedBlock());
	});
});

describe("setForkedBlock", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should set forkedBlock", () => {
		const block = {
			id: "dummy_id",
		};
		// @ts-ignore
		stateStorage.setForkedBlock(block);
		assert.equal(stateStorage.getForkedBlock(), block);
	});
});

describe("clearForkedBlock", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should clear forkedBlock", () => {
		const block = {
			id: "dummy_id",
		};
		// @ts-ignore
		stateStorage.setForkedBlock(block);
		assert.equal(stateStorage.getForkedBlock(), block);

		stateStorage.clearForkedBlock();
		assert.undefined(stateStorage.getForkedBlock());
	});
});

describe("getNoBlockCounter", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return 0 by default", () => {
		assert.equal(stateStorage.getNoBlockCounter(), 0);
	});
});

describe("setNoBlockCounter", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should set noBlockCounter", () => {
		stateStorage.setNoBlockCounter(3);
		assert.equal(stateStorage.getNoBlockCounter(), 3);
	});
});

describe("getP2pUpdateCounter", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return 0 by default", () => {
		assert.equal(stateStorage.getP2pUpdateCounter(), 0);
	});
});

describe("setP2pUpdateCounter", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should set p2pUpdateCounter", () => {
		stateStorage.setP2pUpdateCounter(3);
		assert.equal(stateStorage.getP2pUpdateCounter(), 3);
	});
});

describe("getNumberOfBlocksToRollback", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return 0 by default", () => {
		assert.equal(stateStorage.getNumberOfBlocksToRollback(), 0);
	});
});

describe("setNumberOfBlocksToRollback", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should set numberOfBlocksToRollback", () => {
		stateStorage.setNumberOfBlocksToRollback(3);
		assert.equal(stateStorage.getNumberOfBlocksToRollback(), 3);
	});
});

describe("getNetworkStart", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return false by default", () => {
		assert.false(stateStorage.getNetworkStart());
	});
});

describe("setNetworkStart", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should set networkStart", () => {
		stateStorage.setNetworkStart(true);
		assert.true(stateStorage.getNetworkStart());
	});
});

describe("getRestoredDatabaseIntegrity", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return false by default", () => {
		assert.false(stateStorage.getRestoredDatabaseIntegrity());
	});
});

describe("setRestoredDatabaseIntegrity", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should set restoredDatabaseIntegrity", () => {
		stateStorage.setRestoredDatabaseIntegrity(true);
		assert.true(stateStorage.getRestoredDatabaseIntegrity());
	});
});

describe("getMaxLastBlocks", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return max last blocks limit", () => {
		assert.equal(stateStorage.getMaxLastBlocks(), 100);
	});
});

describe("getLastHeight", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return the last block height", () => {
		stateStorage.setLastBlock(blocks[0]);
		stateStorage.setLastBlock(blocks[1]);

		assert.equal(stateStorage.getLastHeight(), blocks[1].data.height);
	});
});

describe("getLastBlock", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should throw when there is no last block", () => {
		// TODO: check that we now prefer this to throw than toBeUndefined()?
		assert.throws(() => stateStorage.getLastBlock());
	});

	it("should return the last block", () => {
		stateStorage.setLastBlock(blocks[0]);
		stateStorage.setLastBlock(blocks[1]);

		assert.equal(stateStorage.getLastBlock(), blocks[1]);
	});
});

describe("setLastBlock", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should set the last block", () => {
		stateStorage.setLastBlock(blocks[0]);
		assert.equal(stateStorage.getLastBlock(), blocks[0]);
	});

	it("should not exceed the max last blocks", () => {
		for (let i = 0; i < 100; i++) {
			// 100 is default
			stateStorage.setLastBlock(blocks[i]);
		}

		assert.length(stateStorage.getLastBlocks(), 100);
		assert.equal(stateStorage.getLastBlock(), blocks[99]);
		assert.equal(stateStorage.getLastBlocks().slice(-1)[0], blocks[0]);

		// Push one more to remove the first last block.
		stateStorage.setLastBlock(blocks[100]);

		assert.length(stateStorage.getLastBlocks(), 100);
		assert.equal(stateStorage.getLastBlock(), blocks[100]);
		assert.equal(stateStorage.getLastBlocks().slice(-1)[0], blocks[1]);
	});

	it("should remove last blocks when going to lower height", () => {
		for (let i = 0; i < 100; i++) {
			// 100 is default
			stateStorage.setLastBlock(blocks[i]);
		}

		assert.length(stateStorage.getLastBlocks(), 100);
		assert.equal(stateStorage.getLastBlock(), blocks[99]);

		// Set last height - 1
		stateStorage.setLastBlock(blocks[98]);

		assert.length(stateStorage.getLastBlocks(), 99);
		assert.equal(stateStorage.getLastBlock(), blocks[98]);

		// Set to first block
		stateStorage.setLastBlock(blocks[0]);
		assert.length(stateStorage.getLastBlocks(), 1);
		assert.equal(stateStorage.getLastBlock(), blocks[0]);
	});
});

describe("getLastBlocks", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return the last blocks", () => {
		for (let i = 0; i < 5; i++) {
			stateStorage.setLastBlock(blocks[i]);
		}

		const lastBlocks = stateStorage.getLastBlocks();
		assert.length(lastBlocks, 5);

		for (let i = 0; i < 5; i++) {
			assert.equal(lastBlocks[i].data.height, 6 - i); // Height started at 2
			assert.equal(lastBlocks[i], blocks[4 - i]);
		}
	});
});

describe("getLastBlocksData", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return the last blocks data", () => {
		for (let i = 0; i < 5; i++) {
			stateStorage.setLastBlock(blocks[i]);
		}

		const lastBlocksData = stateStorage.getLastBlocksData().toArray() as IBlockData[];
		assert.length(lastBlocksData, 5);

		for (let i = 0; i < 5; i++) {
			assert.equal(lastBlocksData[i].height, 6 - i); // Height started at 2
			assert.true(lastBlocksData[i].hasOwnProperty("transactions"));
			delete lastBlocksData[i].transactions;
			assert.equal(lastBlocksData[i], blocks[4 - i].data);
		}
	});

	it("should return last blocks data with headers only", () => {
		for (let i = 0; i < 5; i++) {
			stateStorage.setLastBlock(blocks[i]);
		}

		const lastBlocksData = stateStorage.getLastBlocksData(true).toArray() as IBlockData[];

		assert.length(lastBlocksData, 5);
	});

	it("should return last blocks which have transactions", () => {
		for (let i = 0; i < 5; i++) {
			// @ts-ignore
			blocks[i].transactions = [
				// @ts-ignore
				{
					id: "test",
				},
			];
			stateStorage.setLastBlock(blocks[i]);
		}

		const lastBlocksData = stateStorage.getLastBlocksData().toArray() as IBlockData[];

		assert.length(lastBlocksData, 5);
	});

	it("should handle milestones", () => {
		blocks[0].data.height = 1;
		stateStorage.setLastBlock(blocks[0]);

		assert.true(dispatchSpy.calledWith("crypto.milestone.changed"));
	});
});

describe("getLastBlockIds", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return the last blocks data", () => {
		for (let i = 0; i < 5; i++) {
			stateStorage.setLastBlock(blocks[i]);
		}

		const lastBlockIds = stateStorage.getLastBlockIds();
		assert.length(lastBlockIds, 5);

		for (let i = 0; i < 5; i++) {
			assert.equal(lastBlockIds[i], blocks[4 - i].data.id);
		}
	});
});

describe("getGenesisBlock", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should set and get the genesis block", () => {
		const genesisBlock = blocks[0];
		assert.not.throws(() => stateStorage.setGenesisBlock(genesisBlock));
		assert.equal(stateStorage.getGenesisBlock(), genesisBlock);
	});
});

describe("getLastBlocksByHeight", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return the last blocks data", () => {
		for (let i = 0; i < 100; i++) {
			stateStorage.setLastBlock(blocks[i]);
		}

		const lastBlocksByHeight = stateStorage.getLastBlocksByHeight(0, 101);
		assert.length(lastBlocksByHeight, 100);
		assert.equal(lastBlocksByHeight[0].height, blocks[0].data.height);
	});

	it("should return one last block if no end height", () => {
		for (let i = 0; i < 100; i++) {
			stateStorage.setLastBlock(blocks[i]);
		}

		const lastBlocksByHeight = stateStorage.getLastBlocksByHeight(50);
		assert.length(lastBlocksByHeight, 1);
		assert.equal(lastBlocksByHeight[0].height, 50);
	});

	it("should return full blocks and block headers", () => {
		// TODO: should use the factory and inject transactions
		stateStorage.setLastBlock(blocks[0]);

		let lastBlocksByHeight = stateStorage.getLastBlocksByHeight(2, 2, true);
		assert.length(lastBlocksByHeight, 1);
		assert.equal(lastBlocksByHeight[0].height, 2);
		assert.undefined(lastBlocksByHeight[0].transactions);

		lastBlocksByHeight = stateStorage.getLastBlocksByHeight(2, 2);
		assert.length(lastBlocksByHeight, 1);
		assert.equal(lastBlocksByHeight[0].height, 2);
		assert.length(lastBlocksByHeight[0].transactions, 0);
	});
});

describe("get/setLastDownloadedBlock", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return undefined if last downloaded block is not set", () => {
		assert.undefined(stateStorage.getLastDownloadedBlock());
	});

	it("should set and get last downloaded block", () => {
		const blockData = blocks[0].data;
		stateStorage.setLastDownloadedBlock(blockData);
		assert.equal(stateStorage.getLastDownloadedBlock(), blockData);
	});
});

describe("get/setLastStoredBlockHeight", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return undefined if last stored block is not set", () => {
		assert.equal(stateStorage.getLastStoredBlockHeight(), 1);
	});

	it("should set and get last downloaded block", () => {
		stateStorage.setLastStoredBlockHeight(10);
		assert.equal(stateStorage.getLastStoredBlockHeight(), 10);
	});
});

describe("getCommonBlocks", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should get common blocks", () => {
		for (let i = 0; i < 100; i++) {
			stateStorage.setLastBlock(blocks[i]);
		}

		// Heights 90 - 100
		const ids = blocks.slice(89, 99).map((block) => block.data.id);
		const commonBlocks = stateStorage.getCommonBlocks(ids);
		assert.length(ids, 10);
		assert.length(commonBlocks, 10);

		for (let i = 0; i < commonBlocks.length; i++) {
			assert.equal(commonBlocks[i].height, blocks[98 - i].data.height);
		}
	});
});

describe("cacheTransactions", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should add transaction id", () => {
		assert.equal(stateStorage.cacheTransactions([{ id: "1" } as ITransactionData]), {
			added: [{ id: "1" }],
			notAdded: [],
		});
		assert.length(stateStorage.getCachedTransactionIds(), 1);
	});

	it("should not add duplicate transaction ids", () => {
		assert.equal(stateStorage.cacheTransactions([{ id: "1" } as ITransactionData]), {
			added: [{ id: "1" }],
			notAdded: [],
		});
		assert.equal(stateStorage.cacheTransactions([{ id: "1" } as ITransactionData]), {
			added: [],
			notAdded: [{ id: "1" }],
		});
		assert.length(stateStorage.getCachedTransactionIds(), 1);
	});

	it("should not add more than 10000 unique transaction ids", () => {
		const transactions = [];
		for (let i = 0; i < 10000; i++) {
			transactions.push({ id: i.toString() });
		}

		assert.equal(stateStorage.cacheTransactions(transactions), {
			added: transactions,
			notAdded: [],
		});

		assert.length(stateStorage.getCachedTransactionIds(), 10000);
		assert.equal(stateStorage.getCachedTransactionIds()[0], "0");

		assert.equal(stateStorage.cacheTransactions([{ id: "10000" } as any]), {
			added: [{ id: "10000" }],
			notAdded: [],
		});
		assert.length(stateStorage.getCachedTransactionIds(), 10000);
		assert.equal(stateStorage.getCachedTransactionIds()[0], "1");
	});
});

describe("clearCachedTransactionIds", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should remove cached transaction ids", () => {
		const transactions = [];
		for (let i = 0; i < 10; i++) {
			transactions.push({ id: i.toString() });
		}

		assert.equal(stateStorage.cacheTransactions(transactions), {
			added: transactions,
			notAdded: [],
		});

		assert.length(stateStorage.getCachedTransactionIds(), 10);
		stateStorage.clearCachedTransactionIds();
		assert.length(stateStorage.getCachedTransactionIds(), 0);
	});
});

describe("reset", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should reset initial blockchain state", () => {
		const mockBlockChainMachine = {
			initialState: "mock",
		};
		stateStorage.reset(mockBlockChainMachine);

		assert.equal(stateStorage.getBlockchain(), mockBlockChainMachine.initialState);
	});
});

describe("pingBlock", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return false if there is no blockPing", () => {
		// @ts-ignore
		stateStorage.blockPing = undefined;
		assert.false(stateStorage.pingBlock(blocks[5].data));
	});

	it("should return true if block pinged == current blockPing and should update stats", async () => {
		const clock = Sinon.useFakeTimers();
		const currentTime = new Date().getTime();

		// @ts-ignore
		stateStorage.blockPing = {
			count: 1,
			first: currentTime,
			last: currentTime,
			block: blocks[5].data,
		};

		clock.tick(100);

		assert.true(stateStorage.pingBlock(blocks[5].data));

		const blockPing = stateStorage.getBlockPing()!;
		assert.equal(blockPing.count, 2);
		assert.equal(blockPing.block, blocks[5].data);
		assert.true(blockPing.last > currentTime);
		assert.equal(blockPing.first, currentTime);

		clock.restore();
	});

	it("should return false if block pinged != current blockPing", () => {
		const currentTime = new Date().getTime();
		// @ts-ignore
		stateStorage.blockPing = {
			count: 1,
			first: currentTime,
			last: currentTime,
			block: blocks[3].data,
		};
		assert.false(stateStorage.pingBlock(blocks[5].data));

		const blockPing = stateStorage.getBlockPing()!;
		assert.equal(blockPing.count, 1);
		assert.equal(blockPing.block, blocks[3].data);
		assert.equal(blockPing.last, currentTime);
		assert.equal(blockPing.first, currentTime);
	});
});

describe("pushPingBlock", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should push the block provided as blockPing", () => {
		// @ts-ignore
		stateStorage.blockPing = undefined;

		stateStorage.pushPingBlock(blocks[5].data);

		const blockPing = stateStorage.getBlockPing()!;
		assert.object(blockPing);
		assert.equal(blockPing.block, blocks[5].data);
		assert.equal(blockPing.count, 1);
	});

	it("should log info message if there is already a blockPing", async () => {
		// @ts-ignore
		stateStorage.blockPing = {
			count: 1,
			first: new Date().getTime(),
			last: new Date().getTime(),
			block: blocks[3].data,
		};

		stateStorage.pushPingBlock(blocks[5].data);
		assert.true(
			logger.calledWith(`Previous block ${blocks[3].data.height.toLocaleString()} pinged blockchain 1 times`),
		);

		const blockPing = stateStorage.getBlockPing()!;
		assert.object(blockPing);
		assert.equal(blockPing.block, blocks[5].data);
		assert.equal(blockPing.count, 1);
	});

	it("should log info message if there is already a blockPing when pushed fromForger", async () => {
		// @ts-ignore
		stateStorage.blockPing = {
			count: 0,
			first: new Date().getTime(),
			last: new Date().getTime(),
			block: blocks[3].data,
		};

		stateStorage.pushPingBlock(blocks[5].data, true);
		assert.true(
			logger.calledWith(`Previous block ${blocks[3].data.height.toLocaleString()} pinged blockchain 0 times`),
		);

		const blockPing = stateStorage.getBlockPing()!;
		assert.object(blockPing);
		assert.equal(blockPing.block, blocks[5].data);
		assert.equal(blockPing.count, 0);
	});
});

describe("isWakeUpTimeoutSet", ({ it, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);

	it("should return false if timer is not set", async () => {
		assert.false(stateStorage.isWakeUpTimeoutSet());
	});

	it("should return true if timer is set", async () => {
		const clock = Sinon.useFakeTimers();

		stateStorage.setWakeUpTimeout(() => {}, 100);

		assert.true(stateStorage.isWakeUpTimeoutSet());

		clock.tick(200);

		assert.false(stateStorage.isWakeUpTimeoutSet());

		clock.restore();
	});
});

describe("setWakeUpTimeout", ({ it, beforeEach, assert, spy }) => {
	beforeEach(beforeEachCallback);

	it("should call callback and clear timeout", async () => {
		const clock = Sinon.useFakeTimers();

		const callback = () => {};
		const spyFn = spy(callback);
		const spyOnClearWakeUpTimeout = spy(stateStorage, "clearWakeUpTimeout");

		stateStorage.setWakeUpTimeout(() => {}, 100);

		clock.tick(200);

		spyFn.calledOnce();
		spyOnClearWakeUpTimeout.calledOnce();

		clock.restore();
	});
});

describe("clearWakeUpTimeout", ({ it, beforeEach, assert, spy }) => {
	beforeEach(beforeEachCallback);

	it("should clear wake up timers", () => {
		const clock = Sinon.useFakeTimers();
		const timeoutSpy = spy(clock, "clearTimeout");

		// @ts-ignore
		stateStorage.wakeUpTimeout = 1;

		stateStorage.clearWakeUpTimeout();

		// @ts-ignore
		assert.undefined(stateStorage.wakeUpTimeout);
		timeoutSpy.calledOnce();

		clock.restore();
	});

	it("should do nothing if a timer is not set", () => {
		const clock = Sinon.useFakeTimers();
		const timeoutSpy = spy(clock, "clearTimeout");

		stateStorage.clearWakeUpTimeout();

		timeoutSpy.neverCalled();

		clock.restore();
	});
});
