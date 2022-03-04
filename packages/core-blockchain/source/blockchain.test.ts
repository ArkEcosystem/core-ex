import { Container, Contracts, Enums, Services, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers, Networks, Utils } from "@arkecosystem/crypto";
import { MemoryQueue } from "@arkecosystem/core-kernel/distribution/services/queue/drivers/memory";
import { Actions } from "@arkecosystem/core-state";

import { describe, Sandbox } from "../../core-test-framework";
import delay from "delay";
import { EventEmitter } from "events";

import { ProcessBlockAction } from "./actions";
import { Blockchain } from "./blockchain";
import { ProcessBlocksJob } from "./process-blocks-job";

EventEmitter.prototype.constructor = Object.prototype.constructor;

describe<{
	sandbox: Sandbox;
	configuration: any;
	logService: any;
	stateStore: any;
	databaseService: any;
	blockRepository: any;
	transactionPoolService: any;
	stateMachine: any;
	eventDispatcherService: any;
	peerNetworkMonitor: any;
	peerRepository: any;
	blockProcessor: any;
	databaseInteractions: any;
	blockData: Interfaces.IBlockData;
	blockHeight1: any;
	blockHeight2: any;
	blockHeight3: any;
}>("Blockchain", ({ assert, beforeEach, it, spy, spyFn, stub, stubFn }) => {
	beforeEach((context) => {
		context.configuration = {
			getOptional: (key, defaultValue) => defaultValue,
		};
		context.logService = {
			warning: () => undefined,
			info: () => undefined,
			error: () => undefined,
			debug: () => undefined,
		};
		context.stateStore = {
			reset: () => undefined,
			getMaxLastBlocks: () => 200,
			clearWakeUpTimeout: () => undefined,
			wakeUpTimeout: undefined,
			blockPing: undefined,
			getGenesisBlock: () => ({ data: Networks.testnet.genesisBlock }),
			getLastDownloadedBlock: () => undefined,
			setLastDownloadedBlock: () => undefined,
			getNumberOfBlocksToRollback: () => 0,
			setNumberOfBlocksToRollback: () => undefined,
			getNetworkStart: () => false,
			setNetworkStart: () => undefined,
			setLastStoredBlockHeight: () => undefined,
			getLastBlock: () => undefined,
			setLastBlock: () => undefined,
			setForkedBlock: () => undefined,
			setWakeUpTimeout: () => undefined,
			pushPingBlock: () => undefined,
			pingBlock: () => undefined,
		};
		context.databaseService = {
			deleteRound: () => undefined,
			revertBlock: () => undefined,
		};
		context.blockRepository = {
			deleteBlocks: () => undefined,
			deleteTopBlocks: () => undefined,
			saveBlocks: () => undefined,
		};
		context.transactionPoolService = {
			readdTransactions: () => undefined,
		};
		context.stateMachine = {
			transition: () => undefined,
		};
		context.eventDispatcherService = {
			listen: () => undefined,
			dispatch: () => undefined,
		};
		context.peerNetworkMonitor = {
			cleansePeers: () => undefined,
			broadcastBlock: () => undefined,
			checkNetworkHealth: () => undefined,
		};
		context.peerRepository = {
			hasPeers: () => undefined,
		};
		context.blockProcessor = {
			process: () => undefined,
		};
		context.databaseInteractions = {
			getTopBlocks: () => undefined,
			getLastBlock: () => undefined,
			restoreCurrentRound: () => undefined,
			revertBlock: () => undefined,
			deleteRound: () => undefined,
			getActiveDelegates: () => [],
		};

		context.blockData = { height: 30122 } as Interfaces.IBlockData;

		context.blockHeight1 = {
			data: {
				id: "17184958558311101492",
				version: 0,
				timestamp: 0,
				height: 1,
			},
			transactions: [],
		};
		context.blockHeight2 = {
			data: {
				id: "17882607875259085966",
				version: 0,
				timestamp: 46583330,
				height: 2,
				reward: Utils.BigNumber.make("0"),
				previousBlock: "17184958558311101492",
				numberOfTransactions: 0,
				totalAmount: Utils.BigNumber.make("0"),
				totalFee: Utils.BigNumber.make("0"),
				payloadLength: 0,
				payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
				generatorPublicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
				blockSignature:
					"3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
				createdAt: "2018-09-11T16:48:50.550Z",
			},
			transactions: [],
		};
		context.blockHeight3 = {
			data: {
				id: "7242383292164246617",
				version: 0,
				timestamp: 46583338,
				height: 3,
				reward: Utils.BigNumber.make("0"),
				previousBlock: "17882607875259085966",
				numberOfTransactions: 0,
				totalAmount: Utils.BigNumber.make("0"),
				totalFee: Utils.BigNumber.make("0"),
				payloadLength: 0,
				payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
				generatorPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
				blockSignature:
					"304402204087bb1d2c82b9178b02b9b3f285de260cdf0778643064fe6c7aef27321d49520220594c57009c1fca543350126d277c6adeb674c00685a464c3e4bf0d634dc37e39",
				createdAt: "2018-09-11T16:48:58.431Z",
			},
			transactions: [],
		};

		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue(context.configuration);
		context.sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(context.logService);
		context.sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(context.stateStore);
		context.sandbox.app.bind(Container.Identifiers.DatabaseService).toConstantValue(context.databaseService);
		context.sandbox.app
			.bind(Container.Identifiers.DatabaseInteraction)
			.toConstantValue(context.databaseInteractions);
		context.sandbox.app
			.bind(Container.Identifiers.DatabaseBlockRepository)
			.toConstantValue(context.blockRepository);
		context.sandbox.app
			.bind(Container.Identifiers.TransactionPoolService)
			.toConstantValue(context.transactionPoolService);
		context.sandbox.app.bind(Container.Identifiers.StateMachine).toConstantValue(context.stateMachine);
		context.sandbox.app
			.bind(Container.Identifiers.EventDispatcherService)
			.toConstantValue(context.eventDispatcherService);
		context.sandbox.app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue(context.peerNetworkMonitor);
		context.sandbox.app.bind(Container.Identifiers.PeerRepository).toConstantValue(context.peerRepository);
		context.sandbox.app.bind(Container.Identifiers.BlockchainService).to(Blockchain).inSingletonScope();
		context.sandbox.app.bind(Container.Identifiers.BlockProcessor).toConstantValue(context.blockProcessor);
		context.sandbox.app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});
		context.sandbox.app.bind(Container.Identifiers.WalletRepository).toConstantValue({});

		context.sandbox.app
			.bind(Container.Identifiers.TriggerService)
			.to(Services.Triggers.Triggers)
			.inSingletonScope();
		context.sandbox.app
			.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
			.bind("processBlock", new ProcessBlockAction());

		context.sandbox.app
			.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
			.bind("getActiveDelegates", new Actions.GetActiveDelegatesAction(context.sandbox.app));

		context.sandbox.app.bind(Container.Identifiers.QueueFactory).toFactory(
			(context: Container.interfaces.Context) =>
				async <K, T>(name?: string): Promise<Contracts.Kernel.Queue> =>
					context.sandbox.app.resolve<Contracts.Kernel.Queue>(MemoryQueue).make(),
		);

		const getTimeStampForBlock = (height: number) => {
			switch (height) {
				case 1:
					return 0;
				default:
					throw new Error(`Test scenarios should not hit this line`);
			}
		};

		const spyblockTimeLookup = jest.spyOn(AppUtils.forgingInfoCalculator, "getBlockTimeLookup");

		spyblockTimeLookup.mockResolvedValue(getTimeStampForBlock);

		Managers.configManager.setFromPreset("testnet");
	});

	it("initialize should log a warning if networkStart option is provided", (context) => {
		configuration.getOptional.mockReturnValueOnce(true);
		stateStore.getNetworkStart = jest.fn().mockReturnValue(true);

		context.sandbox.app.resolve<Blockchain>(Blockchain);

		expect(logService.warning).toBeCalledTimes(1);
		expect(stateStore.setNetworkStart).toHaveBeenCalledWith(true);
	});

	it("initialize should not log a warning if networkStart option isn't provided", (context) => {
		context.sandbox.app.resolve<Blockchain>(Blockchain);
		expect(logService.warning).toBeCalledTimes(0);
	});

	it("getQueue should return instance of queue", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		expect(blockchain.getQueue()).toBeInstanceOf(MemoryQueue);
	});

	it("dispatch should call transition method on stateMachine with the event provided", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const eventToDispatch = "any.event.to.dispatch";

		expect(stateMachine.transition).toBeCalledTimes(0);
		blockchain.dispatch(eventToDispatch);
		expect(stateMachine.transition).toBeCalledTimes(1);
		expect(stateMachine.transition).toHaveBeenLastCalledWith(eventToDispatch);
	});

	it("boot should dispatch 'START'", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyDispatch = jest.spyOn(blockchain, "dispatch");

		expect(blockchain.isBooted()).toBeFalse();
		stateStore.isStarted = jest.fn().mockReturnValue(true);
		await blockchain.boot();

		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toHaveBeenLastCalledWith("START");
		expect(blockchain.isBooted()).toBeTrue();
	});

	it("boot should dispatch START and return true even if stateStore is not ready when skipStartedCheck === true", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyDispatch = jest.spyOn(blockchain, "dispatch");

		stateStore.started = false;
		const bootResult = await blockchain.boot(true);

		expect(bootResult).toBeTrue();
		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toHaveBeenLastCalledWith("START");

		// should be the same with process.env.CORE_SKIP_BLOCKCHAIN_STARTED_CHECK
		jest.resetAllMocks();
		stateStore.started = false;
		process.env.CORE_SKIP_BLOCKCHAIN_STARTED_CHECK = "true";
		const bootResultEnv = await blockchain.boot();

		expect(bootResultEnv).toBeTrue();
		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toHaveBeenLastCalledWith("START");

		delete process.env.CORE_SKIP_BLOCKCHAIN_STARTED_CHECK;
	});

	it("boot should wait for stateStore to be started before resolving", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		stateStore.isStarted = jest.fn().mockReturnValue(false);
		const resolved = jest.fn();
		const checkBootResolved = async () => {
			await blockchain.boot();
			resolved();
		};
		checkBootResolved();

		// will not resolve after 2 seconds while stateStore.started is false
		await delay(2000);
		expect(resolved).toBeCalledTimes(0);

		// will resolve after 1 second when stateStore.started is true
		stateStore.isStarted = jest.fn().mockReturnValue(true);
		await delay(1100);

		expect(resolved).toBeCalledTimes(1);
	});

	it("boot should call cleansePeers and set listener on ForgerEvent.Missing and RoundEvent.Applied", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		stateStore.isStarted = jest.fn().mockReturnValue(true);

		expect(peerNetworkMonitor.cleansePeers).toBeCalledTimes(0);

		await blockchain.boot();

		expect(peerNetworkMonitor.cleansePeers).toBeCalledTimes(1);
		expect(eventDispatcherService.listen).toHaveBeenCalledTimes(2);
		expect(eventDispatcherService.listen).toHaveBeenNthCalledWith(1, Enums.ForgerEvent.Missing, {
			handle: expect.any(Function),
		});
		expect(eventDispatcherService.listen).toHaveBeenNthCalledWith(2, Enums.RoundEvent.Applied, {
			handle: expect.any(Function),
		});
	});

	it("dispose should call clearWakeUpTimeout on stateStore and dispatch 'STOP'", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		const spyDispatch = jest.spyOn(blockchain, "dispatch");

		expect(blockchain.isStopped()).toBeFalse();
		await blockchain.dispose();

		expect(stateStore.clearWakeUpTimeout).toBeCalledTimes(1);
		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toHaveBeenLastCalledWith("STOP");
		expect(blockchain.isStopped()).toBeTrue();
	});

	it("dispose should ignore if already stopped", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyDispatch = jest.spyOn(blockchain, "dispatch");

		// @ts-ignore
		blockchain.stopped = true;

		await blockchain.dispose();

		expect(spyDispatch).not.toHaveBeenCalled();
	});

	it("setWakeUp should set wakeUpTimeout on stateStore", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		blockchain.setWakeUp();
		expect(stateStore.setWakeUpTimeout).toHaveBeenCalled();
	});

	it("setWakeUp should dispatch WAKEUP when wake up function is called", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyDispatch = jest.spyOn(blockchain, "dispatch");

		blockchain.setWakeUp();
		expect(spyDispatch).toBeCalledTimes(0);

		expect(stateStore.setWakeUpTimeout).toHaveBeenCalledWith(expect.toBeFunction(), 60000);

		// Call given callback function
		stateStore.setWakeUpTimeout.mock.calls[0][0]();

		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toBeCalledWith("WAKEUP");
	});

	it("resetWakeUp should call stateStore clearWakeUpTimeout and own setWakeUp method", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spySetWakeUp = jest.spyOn(blockchain, "setWakeUp");

		blockchain.resetWakeUp();

		expect(stateStore.clearWakeUpTimeout).toBeCalledTimes(1);
		expect(spySetWakeUp).toBeCalledTimes(1);
	});

	it("clearAndStopQueue should set state.lastDownloadedBlock from this.getLastBlock() and clear queue", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		const spyClearQueue = jest.spyOn(blockchain, "clearQueue");
		stateStore.getLastDownloadedBlock = jest.fn();
		stateStore.setLastDownloadedBlock = jest.fn();
		const mockLastBlock = { data: { id: "abcd1234" } };
		stateStore.getLastBlock = jest.fn().mockImplementation(() => mockLastBlock);

		blockchain.clearAndStopQueue();

		expect(stateStore.setLastDownloadedBlock).toHaveBeenCalledWith(mockLastBlock.data);
		expect(spyClearQueue).toBeCalledTimes(1);
	});

	it("clearQueue should call queue.clear", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		// @ts-ignore
		const spyQueueClear = jest.spyOn(blockchain.queue, "clear");

		blockchain.clearQueue();

		expect(spyQueueClear).toBeCalledTimes(1);
	});

	it("handleIncomingBlock when state is started should dispatch 'NEWBLOCK', BlockEvent.Received and enqueue the block", async (context) => {
		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(1);

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyDispatch = jest.spyOn(blockchain, "dispatch");
		const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
		stateStore.started = true;
		stateStore.getLastBlock = jest.fn().mockReturnValue({ data: context.blockData });

		await blockchain.handleIncomingBlock(context.blockData);

		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toHaveBeenLastCalledWith("NEWBLOCK");

		expect(eventDispatcherService.dispatch).toBeCalledTimes(1);
		expect(eventDispatcherService.dispatch).toHaveBeenLastCalledWith(Enums.BlockEvent.Received, context.blockData);

		expect(spyEnqueue).toBeCalledTimes(1);
		expect(spyEnqueue).toHaveBeenLastCalledWith([context.blockData]);
	});

	it("handleIncomingBlock when state is started should not dispatch anything nor enqueue the block if receivedSlot > currentSlot", async (context) => {
		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(1);

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
		stateStore.started = true;
		stateStore.getLastBlock = jest.fn().mockReturnValue({ data: context.blockData });

		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(2);

		await blockchain.handleIncomingBlock(context.blockData);

		expect(spyEnqueue).toBeCalledTimes(0);
		expect(eventDispatcherService.dispatch).toBeCalledTimes(0);
	});

	it("handleIncomingBlock when state is started should handle block from forger if in right slot", async (context) => {
		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(1);

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
		const spyDispatch = jest.spyOn(blockchain, "dispatch");
		stateStore.started = true;
		stateStore.getLastBlock = jest.fn().mockReturnValue({ data: context.blockData });

		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(1);
		jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot").mockReturnValueOnce(5000);

		await blockchain.handleIncomingBlock(context.blockData, true);

		expect(spyEnqueue).toBeCalledTimes(1);
		expect(spyEnqueue).toHaveBeenLastCalledWith([context.blockData]);
		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toHaveBeenLastCalledWith("NEWBLOCK");
	});

	for (const fromForger of [true, false]) {
		it("handleIncomingBlock when state is started should not handle block if in wrong slot", async (context) => {
			jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(1);

			const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
			const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
			const spyDispatch = jest.spyOn(blockchain, "dispatch");
			stateStore.started = true;
			stateStore.getLastBlock = jest.fn().mockReturnValue({ data: context.blockData });

			jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(2);
			jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot").mockReturnValueOnce(5000);

			await blockchain.handleIncomingBlock(context.blockData, fromForger);

			expect(spyEnqueue).toBeCalledTimes(0);
			expect(spyDispatch).toBeCalledTimes(0);
		});
	}

	it("handleIncomingBlock when state is started should not handle block from forger if less than 2 seconds left in slot", async (context) => {
		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(1);

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
		const spyDispatch = jest.spyOn(blockchain, "dispatch");
		stateStore.started = true;
		stateStore.getLastBlock = jest.fn().mockReturnValue({ data: context.blockData });

		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(1);
		jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot").mockReturnValueOnce(1500);

		await blockchain.handleIncomingBlock(context.blockData, true);

		expect(spyEnqueue).toBeCalledTimes(0);
		expect(spyDispatch).toBeCalledTimes(0);
	}, 10000);

	it("handleIncomingBlock when state is started should handle block if not from forger if less than 2 seconds left in slot", async (context) => {
		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(1);

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
		const spyDispatch = jest.spyOn(blockchain, "dispatch");
		stateStore.started = true;
		stateStore.getLastBlock = jest.fn().mockReturnValue({ data: context.blockData });

		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(1);
		jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot").mockReturnValueOnce(1500);

		await blockchain.handleIncomingBlock(context.blockData);

		expect(spyEnqueue).toBeCalledTimes(1);
		expect(spyEnqueue).toHaveBeenLastCalledWith([context.blockData]);
		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toHaveBeenLastCalledWith("NEWBLOCK");
	}, 10000);

	it("handleIncomingBlock when state is not started should dispatch BlockEvent.Disregarded and not enqueue the block", async (context) => {
		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(1);

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
		stateStore.isStarted = jest.fn().mockReturnValue(false);

		await blockchain.handleIncomingBlock(context.blockData);

		expect(eventDispatcherService.dispatch).toBeCalledTimes(1);
		expect(eventDispatcherService.dispatch).toHaveBeenLastCalledWith(
			Enums.BlockEvent.Disregarded,
			context.blockData,
		);

		expect(spyEnqueue).toBeCalledTimes(0);
	});

	it("handleIncomingBlock should not dispatch anything nor enqueue the block if receivedSlot > currentSlot", (context) => {
		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(1);

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");

		jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(2);

		blockchain.handleIncomingBlock(context.blockData);

		expect(spyEnqueue).toBeCalledTimes(0);
		expect(eventDispatcherService.dispatch).toBeCalledTimes(0);
	});

	it("enqueueBlocks should just return if blocks provided are an empty array", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		// @ts-ignore
		const spyQueuePush = jest.spyOn(blockchain.queue, "push");

		blockchain.enqueueBlocks([]);
		expect(spyQueuePush).not.toHaveBeenCalled();
	});

	it("enqueueBlocks should enqueue the blocks", async (context) => {
		const blockData = { height: 30122, numberOfTransactions: 0 } as Interfaces.IBlockData;

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue({ height: 23111 });

		// @ts-ignore
		const spyQueuePush = jest.spyOn(blockchain.queue, "push");
		const spySetBlocks = jest.spyOn(ProcessBlocksJob.prototype, "setBlocks");

		blockchain.enqueueBlocks([blockData]);

		expect(spyQueuePush).toHaveBeenCalled();
		expect(spySetBlocks).toHaveBeenCalledWith([blockData]);
	});

	it("enqueueBlocks should push a chunk to the queue when currentTransactionsCount >= 150", async (context) => {
		const blockData = { height: 30122, numberOfTransactions: 0 } as Interfaces.IBlockData;

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue({ height: 23111 });

		// @ts-ignore
		const spyQueuePush = jest.spyOn(blockchain.queue, "push");
		const spySetBlocks = jest.spyOn(ProcessBlocksJob.prototype, "setBlocks");

		const blockWith150Txs = {
			height: blockData.height + 1,
			numberOfTransactions: 150,
		} as Interfaces.IBlockData;

		blockchain.enqueueBlocks([blockWith150Txs, blockData]);

		expect(spyQueuePush).toHaveBeenCalledTimes(2);
		expect(spySetBlocks).toHaveBeenCalledWith([blockWith150Txs]);
		expect(spySetBlocks).toHaveBeenCalledWith([blockData]);
	});

	it("enqueueBlocks should push a chunk to the queue when currentBlocksChunk.length >= 100", async (context) => {
		const blockData = { height: 30122, numberOfTransactions: 0 } as Interfaces.IBlockData;

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue({ height: 23111 });

		// @ts-ignore
		const spyQueuePush = jest.spyOn(blockchain.queue, "push");
		const spySetBlocks = jest.spyOn(ProcessBlocksJob.prototype, "setBlocks");

		const blocksToEnqueue = [];
		for (let i = 0; i < 101; i++) {
			// @ts-ignore
			blocksToEnqueue.push(blockData);
		}
		blockchain.enqueueBlocks(blocksToEnqueue);

		expect(spyQueuePush).toHaveBeenCalledTimes(2);
		expect(spySetBlocks).toHaveBeenCalledWith(blocksToEnqueue.slice(-1));
		expect(spySetBlocks).toHaveBeenCalledWith([blockData]);
	});

	it("enqueueBlocks should push a chunk to the queue when hitting new milestone", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue({ height: 23111 });

		// @ts-ignore
		const spyQueuePush = jest.spyOn(blockchain.queue, "push");
		const spySetBlocks = jest.spyOn(ProcessBlocksJob.prototype, "setBlocks");

		const blockMilestone = { id: "123", height: 75600 } as Interfaces.IBlockData;
		const blockAfterMilestone = { id: "456", height: 75601 } as Interfaces.IBlockData;
		blockchain.enqueueBlocks([blockMilestone, blockAfterMilestone]);

		expect(spyQueuePush).toHaveBeenCalledTimes(2);
		expect(spySetBlocks).toHaveBeenCalledWith([blockMilestone]);
		expect(spySetBlocks).toHaveBeenCalledWith([blockAfterMilestone]);
	});

	it("removeBlocks should call revertBlock and setLastBlock for each block to be removed, and deleteBlocks with all blocks removed", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		const blocksToRemove = [context.blockHeight1, context.blockHeight2, context.blockHeight3];
		stateStore.getLastBlock = jest
			.fn()
			.mockReturnValueOnce(blocksToRemove[2]) // called in clearAndStopQueue
			.mockReturnValueOnce(blocksToRemove[2]) // called in removeBlocks
			.mockReturnValueOnce(blocksToRemove[2]) // called in __removeBlocks
			.mockReturnValueOnce(blocksToRemove[2]) // called in revertLastBlock
			.mockReturnValueOnce(blocksToRemove[1]) // called in __removeBlocks
			.mockReturnValueOnce(blocksToRemove[1]) // called in revertLastBlock
			.mockReturnValueOnce(context.blockHeight1); // called in validation process
		databaseService.getBlocks = jest
			.fn()
			.mockReturnValueOnce(blocksToRemove.map((b) => ({ ...b.data, transactions: b.transactions })));

		databaseService.getLastBlock = jest.fn().mockReturnValueOnce(context.blockHeight1);

		await blockchain.removeBlocks(2);

		expect(databaseInteractions.revertBlock).toHaveBeenCalledTimes(2);
		expect(stateStore.setLastBlock).toHaveBeenCalledTimes(2);
		expect(blockRepository.deleteBlocks).toHaveBeenCalledTimes(1);
		expect(stateStore.setLastStoredBlockHeight).toHaveBeenCalledTimes(1);
		expect(stateStore.setLastStoredBlockHeight).toHaveBeenCalledWith(1);
	});

	it("removeBlocks should default to removing until genesis block when asked to remove more", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		const genesisBlock = Networks.testnet.genesisBlock;
		stateStore.getLastBlock = jest
			.fn()
			.mockReturnValueOnce(context.blockHeight2) // called in clearAndStopQueue
			.mockReturnValueOnce(context.blockHeight2) // called in removeBlocks
			.mockReturnValueOnce(context.blockHeight2) // called in __removeBlocks
			.mockReturnValueOnce(context.blockHeight2) // called in revertLastBlock
			.mockReturnValue({ data: genesisBlock });
		databaseService.getBlocks = jest.fn().mockReturnValueOnce([
			genesisBlock,
			{
				...context.blockHeight2.data,
				transactions: context.blockHeight2.transactions,
			},
		]);
		databaseService.getLastBlock = jest.fn().mockReturnValue({ data: genesisBlock });

		await blockchain.removeBlocks(context.blockHeight2.data.height + 10);

		expect(databaseInteractions.revertBlock).toHaveBeenCalledTimes(1);
		expect(stateStore.setLastBlock).toHaveBeenCalledTimes(1);
		expect(stateStore.setLastBlock).toHaveBeenCalledWith({ data: genesisBlock });
		expect(blockRepository.deleteBlocks).toHaveBeenCalledTimes(1);
		expect(stateStore.setLastStoredBlockHeight).toHaveBeenCalledTimes(1);
		expect(stateStore.setLastStoredBlockHeight).toHaveBeenCalledWith(1);
	});

	it("removeBlocks should throw if last database block is not the same as last state block", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		// @ts-ignore
		const spyOnProcessExit = jest.spyOn(process, "exit").mockImplementation(() => {});
		const blocksToRemove = [context.blockHeight1, context.blockHeight2, context.blockHeight3];
		stateStore.getLastBlock = jest
			.fn()
			.mockReturnValueOnce(blocksToRemove[2]) // called in clearAndStopQueue
			.mockReturnValueOnce(blocksToRemove[2]) // called in removeBlocks
			.mockReturnValueOnce(blocksToRemove[2]) // called in __removeBlocks
			.mockReturnValueOnce(blocksToRemove[2]) // called in revertLastBlock
			.mockReturnValueOnce(blocksToRemove[1]) // called in __removeBlocks
			.mockReturnValueOnce(blocksToRemove[1]) // called in revertLastBlock
			.mockReturnValue(context.blockHeight1); // called in validation process
		databaseService.getBlocks = jest
			.fn()
			.mockReturnValueOnce(blocksToRemove.map((b) => ({ ...b.data, transactions: b.transactions })));

		databaseService.getLastBlock = jest.fn().mockReturnValueOnce(context.blockHeight3);

		await blockchain.removeBlocks(2);

		expect(logService.error).toHaveBeenCalledTimes(1);
		expect(logService.error.mock.calls[0][0]).toContain(
			`Last stored block (${context.blockHeight3.data.id}) is not the same as last block from state store (${context.blockHeight1.data.id})`,
		);
		expect(logService.warning).toHaveBeenCalledTimes(1);
		expect(spyOnProcessExit).toHaveBeenCalledTimes(1);
	});

	it("removeBlocks should log error and exit process, when error is thrown", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		// @ts-ignore
		const spyOnProcessExit = jest.spyOn(process, "exit").mockImplementation(() => {});

		await blockchain.removeBlocks(0);

		expect(logService.error).toHaveBeenCalledTimes(1);
		expect(logService.warning).toHaveBeenCalledTimes(1);
		expect(spyOnProcessExit).toHaveBeenCalledTimes(1);
	});

	for (const numberOfBlocks of [1, 5, 1329]) {
		it("removeTopBlocks should call deleteTopBlocks with blockRepository and call loadBlocksFromCurrentRound", async (context) => {
			databaseService.getLastBlock = jest.fn().mockReturnValueOnce(context.blockHeight1);

			const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

			await blockchain.removeTopBlocks(numberOfBlocks);

			expect(blockRepository.deleteTopBlocks).toHaveBeenLastCalledWith(numberOfBlocks);
		});
	}

	it("resetLastDownloadedBlock should set this.state.lastDownloadedBlock = this.getLastBlock().data", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		const mockBlock = { data: { id: "123", height: 444 } };
		context.stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

		blockchain.resetLastDownloadedBlock();

		expect(context.stateStore.setLastDownloadedBlock).toHaveBeenCalledWith(mockBlock.data);
	});

	it("forceWakeup should clearWakeUpTimeout and dispatch 'WAKEUP", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		const spyDispatch = jest.spyOn(blockchain, "dispatch");

		blockchain.forceWakeup();

		expect(stateStore.clearWakeUpTimeout).toBeCalledTimes(1);
		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toHaveBeenLastCalledWith("WAKEUP");
	});

	it("forkBlock should set forkedBlock, clear and stop queue and dispatch 'FORK'", async (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		await blockchain.initialize();

		const forkedBlock = { data: { id: "1234", height: 8877 } };
		const numberOfBlocksToRollback = 34;
		const spyClearAndStopQueue = jest.spyOn(blockchain, "clearAndStopQueue");
		const spyDispatch = jest.spyOn(blockchain, "dispatch");
		const mockBlock = { data: { id: "123", height: 444 } };
		stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

		blockchain.forkBlock(forkedBlock as Interfaces.IBlock, numberOfBlocksToRollback);

		expect(stateStore.setForkedBlock).toHaveBeenCalledWith(forkedBlock);
		expect(stateStore.setNumberOfBlocksToRollback).toHaveBeenCalledWith(numberOfBlocksToRollback);
		expect(spyClearAndStopQueue).toBeCalledTimes(1);
		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toHaveBeenLastCalledWith("FORK");
	});

	it("isSynced should return true if we have no peer", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		peerRepository.hasPeers = jest.fn().mockReturnValue(false);

		expect(blockchain.isSynced()).toBeTrue();
	});

	it("isSynced should return true if last block is less than 3 blocktimes away from current slot time", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		peerRepository.hasPeers = jest.fn().mockReturnValue(true);
		const mockBlock = { data: { id: "123", height: 444, timestamp: Crypto.Slots.getTime() - 16 } };
		stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

		expect(blockchain.isSynced()).toBeTrue();
	});

	it("isSynced should return false if last block is more than 3 blocktimes away from current slot time", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		peerRepository.hasPeers = jest.fn().mockReturnValue(true);
		const mockBlock = { data: { id: "123", height: 444, timestamp: Crypto.Slots.getTime() - 25 } };
		stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

		expect(blockchain.isSynced()).toBeFalse();
	});

	it("getLastBlock should return the last block from state", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		const mockBlock = { data: { id: "123", height: 444 } };
		stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

		expect(blockchain.getLastBlock()).toEqual(mockBlock);
		expect(stateStore.getLastBlock).toHaveBeenCalledTimes(1);
	});

	it("getLastHeight should return the last height using getLastBlock", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		const mockBlock = { data: { id: "123", height: 444 } };
		stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);
		const spyGetLastBlock = jest.spyOn(blockchain, "getLastBlock");

		expect(blockchain.getLastHeight()).toEqual(mockBlock.data.height);
		expect(spyGetLastBlock).toHaveBeenCalledTimes(1);
	});

	it("getLastDownloadedBlock should return state.lastDownloadedBlock if it is defined", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		const mockBlock = { data: { id: "123", height: 444 } };
		stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue(mockBlock.data);

		expect(blockchain.getLastDownloadedBlock()).toEqual(mockBlock.data);
	});

	it("getLastDownloadedBlock should return getLastBlock().data if state.lastDownloadedBlock is undefined", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		const mockBlock = { data: { id: "123", height: 444 } };
		stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);
		const spyGetLastBlock = jest.spyOn(blockchain, "getLastBlock");

		expect(blockchain.getLastDownloadedBlock()).toEqual(mockBlock.data);
		expect(spyGetLastBlock).toHaveBeenCalledTimes(1);
	});

	for (const blockPing of [undefined, { block: { data: { id: "123", height: 444 }, count: 3 } }]) {
		it("getBlockPing should return the value of state.blockPing", (context) => {
			const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

			context.stateStore.getBlockPing = jest.fn().mockReturnValue(blockPing);

			assert.equal(blockchain.getBlockPing(), blockPing);
		});
	}

	it("pingBlock should call state.pingBlock", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		const incomingBlock = { id: "123", height: 444 };
		blockchain.pingBlock(incomingBlock as Interfaces.IBlockData);

		expect(stateStore.pingBlock).toBeCalledTimes(1);
		expect(stateStore.pingBlock).toHaveBeenLastCalledWith(incomingBlock);
	});

	it("pushPingBlock should call state.pushPingBlock", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		const incomingBlock = { id: "123", height: 444 };
		const fromForger = true;
		blockchain.pushPingBlock(incomingBlock as Interfaces.IBlockData, fromForger);

		expect(stateStore.pushPingBlock).toBeCalledTimes(1);
		expect(stateStore.pushPingBlock).toHaveBeenLastCalledWith(incomingBlock, fromForger);
	});

	it("pushPingBlock should call state.pushPingBlock with fromForger=false if not specified", (context) => {
		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);

		const incomingBlock = { id: "123", height: 444 };
		blockchain.pushPingBlock(incomingBlock as Interfaces.IBlockData);

		expect(stateStore.pushPingBlock).toBeCalledTimes(1);
		expect(stateStore.pushPingBlock).toHaveBeenLastCalledWith(incomingBlock, false);
	});

	it("checkMissingBlocks when missedBlocks passes the threshold and Math.random()<=0.8, should checkNetworkHealth", async (context) => {
		const threshold = Managers.configManager.getMilestone().activeDelegates / 3 - 1;

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		jest.spyOn(Math, "random").mockReturnValue(0.7);

		peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValue({});
		for (let i = 1; i < threshold; i++) {
			await blockchain.checkMissingBlocks();
			expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(0);
		}

		await blockchain.checkMissingBlocks();
		expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(1);
	});

	it("checkMissingBlocks should skip checkNetworkHealth if last check occurs in past 10 minutes", async (context) => {
		const threshold = Managers.configManager.getMilestone().activeDelegates / 3 - 1;

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		jest.spyOn(Math, "random").mockReturnValue(0.7);

		peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValue({});
		// @ts-ignore
		blockchain.missedBlocks = threshold;
		// @ts-ignore
		blockchain.lastCheckNetworkHealthTs = Date.now();

		await blockchain.checkMissingBlocks();
		expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(0);

		// @ts-ignore
		blockchain.missedBlocks = threshold;
		// @ts-ignore
		blockchain.lastCheckNetworkHealthTs = Date.now() - 11 * 60 * 1000;
		await blockchain.checkMissingBlocks();
		expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(1);
	});

	it("checkMissingBlocks when missedBlocks passes the threshold and Math.random()<=0.8, should checkNetworkHealth and dispatch FORK if forked", async (context) => {
		const threshold = Managers.configManager.getMilestone().activeDelegates / 3 - 1;

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		jest.spyOn(Math, "random").mockReturnValue(0.7);

		const spyDispatch = jest.spyOn(blockchain, "dispatch");

		peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValue({ forked: true });
		for (let i = 1; i < threshold; i++) {
			await blockchain.checkMissingBlocks();
			expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(0);
			expect(spyDispatch).toBeCalledTimes(0);
		}

		await blockchain.checkMissingBlocks();
		expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(1);
		expect(spyDispatch).toBeCalledTimes(1);
		expect(spyDispatch).toBeCalledWith("FORK");
	});

	it("checkMissingBlocks when missedBlocks passes the threshold and Math.random()>0.8, should do nothing", async (context) => {
		const threshold = Managers.configManager.getMilestone().activeDelegates / 3 - 1;

		const blockchain = context.sandbox.app.resolve<Blockchain>(Blockchain);
		jest.spyOn(Math, "random").mockReturnValue(0.9);

		peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValue({});
		for (let i = 1; i < threshold + 10; i++) {
			await blockchain.checkMissingBlocks();
			expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(0);
		}
	});
});
