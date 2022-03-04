import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Enums } from "@arkecosystem/core-kernel";
import { DatabaseInteraction } from "./database-interactions";
import { describe } from "@arkecosystem/core-test-framework";

const app = {
	get: () => undefined,
	terminate: () => undefined,
};
const connection = {
	query: () => undefined,
	close: () => undefined,
};
const blockRepository = {
	findOne: () => undefined,
	findByHeightRange: () => undefined,
	findByHeightRangeWithTransactions: () => undefined,
	findByHeightRangeWithTransactionsForDownload: () => undefined,
	findByHeights: () => undefined,
	findLatest: () => undefined,
	findByIds: () => undefined,
	findRecent: () => undefined,
	findTop: () => undefined,
	count: () => undefined,
	getStatistics: () => undefined,
	saveBlocks: () => undefined,
	deleteBlocks: () => undefined,
};
const transactionRepository = {
	find: () => undefined,
	findOne: () => undefined,
	findByBlockIds: () => undefined,
	getStatistics: () => undefined,
};
const roundRepository = {
	getRound: () => undefined,
	save: () => undefined,
	deleteFrom: () => undefined,
};

const stateStore = {
	setGenesisBlock: () => undefined,
	getGenesisBlock: () => undefined,
	setLastBlock: () => undefined,
	getLastBlock: () => undefined,
	getLastBlocksByHeight: () => undefined,
	getCommonBlocks: () => undefined,
	getLastBlockIds: () => undefined,
};

const stateBlockStore = {
	resize: () => undefined,
};

const stateTransactionStore = {
	resize: () => undefined,
};

const handlerRegistry = {
	getActivatedHandlerForData: () => undefined,
};

const walletRepository = {
	createWallet: () => undefined,
	findByPublicKey: () => undefined,
	findByUsername: () => undefined,
};

const blockState = {
	applyBlock: () => undefined,
	revertBlock: () => undefined,
};

const dposState = {
	buildDelegateRanking: () => undefined,
	setDelegatesRound: () => undefined,
	getRoundDelegates: () => undefined,
};

const getDposPreviousRoundState = () => undefined;

const triggers = {
	call: () => undefined,
};

const events = {
	call: () => undefined,
	dispatch: () => undefined,
};
const logger = {
	error: () => undefined,
	warning: () => undefined,
	info: () => undefined,
	debug: () => undefined,
};
const roundState = {
	applyBlock: () => undefined,
	revertBlock: () => undefined,
	getActiveDelegates: () => undefined,
	restore: () => undefined,
	detectMissedBlocks: () => undefined,
};

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(app);
container.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);
container.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(blockRepository);
container.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);
container.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue(roundRepository);
container.bind(Container.Identifiers.DatabaseService).to(DatabaseService);
container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
container.bind(Container.Identifiers.StateBlockStore).toConstantValue(stateBlockStore);
container.bind(Container.Identifiers.StateTransactionStore).toConstantValue(stateTransactionStore);
container.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue(handlerRegistry);
container.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);
container.bind(Container.Identifiers.BlockState).toConstantValue(blockState);
container.bind(Container.Identifiers.DposState).toConstantValue(dposState);
container.bind(Container.Identifiers.DposPreviousRoundStateProvider).toConstantValue(getDposPreviousRoundState);
container.bind(Container.Identifiers.TriggerService).toConstantValue(triggers);
container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(events);
container.bind(Container.Identifiers.LogService).toConstantValue(logger);
container.bind(Container.Identifiers.RoundState).toConstantValue(roundState);

describe("DatabaseInteractions", ({ it, assert, spy, stub }) => {
	it("should dispatch starting event", async () => {
		const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

		const eventsStub = spy(events, "dispatch");

		await databaseInteraction.initialize();

		eventsStub.calledWith(Enums.StateEvent.Starting);

		eventsStub.restore();
	});

	it("should reset database when CORE_RESET_DATABASE variable is set", async () => {
		try {
			const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

			process.env.CORE_RESET_DATABASE = "1";
			const genesisBlock = {};


			const setSpy = spy(stateStore, "setGenesisBlock");
			const stateStoreStub = stub(stateStore, "getGenesisBlock").returnValue(genesisBlock);

			await databaseInteraction.initialize();
			// expect(databaseInteraction.reset).toBeCalled();
			stateStoreStub.called();
			// expect(databaseInteraction.saveBlocks).toBeCalledWith([genesisBlock]);
			setSpy.called();

			stateStoreStub.restore();
			setSpy.restore();
		} finally {
			delete process.env.CORE_RESET_DATABASE;
		}
	});

	it("should terminate app if exception was raised", async () => {
		const stateStoreStub = stub(stateStore, "setGenesisBlock").callsFake(() => {
			throw new Error("Fail");
		});

		const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

		const appSpy = spy(app, "terminate");

		await databaseInteraction.initialize();
		
		appSpy.called();

		stateStoreStub.restore();
		appSpy.restore();
	});

	it("should terminate if unable to deserialize last 5 blocks", async () => {
		const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

		const block101data = { id: "block101", height: 101 };
		const block102data = { id: "block102", height: 102 };
		const block103data = { id: "block103", height: 103 };
		const block104data = { id: "block104", height: 104 };
		const block105data = { id: "block105", height: 105 };
		const block106data = { id: "block106", height: 105 };

		const blockRepoLatestStub = stub(blockRepository, "findLatest");
		const transRepoStub = stub(transactionRepository, "findByBlockIds");
		const setBlockSpy = spy(stateStore, "setGenesisBlock");
		const deleteBlockSpy = spy(blockRepository, "deleteBlocks");
		const appSpy = spy(app, "terminate");

		blockRepoLatestStub.returnValueOnce(block106data);

		blockRepoLatestStub.returnValueOnce(block106data); // this.getLastBlock
		transRepoStub.returnValueOnce([]); // this.getLastBlock

		blockRepoLatestStub.returnValueOnce(block106data); // blockRepository.deleteBlocks
		blockRepoLatestStub.returnValueOnce(block105data); // this.getLastBlock
		transRepoStub.returnValueOnce([]); // this.getLastBlock

		blockRepoLatestStub.returnValueOnce(block105data); // blockRepository.deleteBlocks
		blockRepoLatestStub.returnValueOnce(block104data); // this.getLastBlock
		transRepoStub.returnValueOnce([]); // this.getLastBlock

		blockRepoLatestStub.returnValueOnce(block104data); // blockRepository.deleteBlocks
		blockRepoLatestStub.returnValueOnce(block103data); // this.getLastBlock
		transRepoStub.returnValueOnce([]); // this.getLastBlock

		blockRepoLatestStub.returnValueOnce(block103data); // blockRepository.deleteBlocks
		blockRepoLatestStub.returnValueOnce(block102data); // this.getLastBlock
		transRepoStub.returnValueOnce([]); // this.getLastBlock

		blockRepoLatestStub.returnValueOnce(block102data); // blockRepository.deleteBlocks
		blockRepoLatestStub.returnValueOnce(block101data); // this.getLastBlock
		transRepoStub.returnValueOnce([]); // this.getLastBlock

		await databaseInteraction.initialize();

		setBlockSpy.called();

		blockRepoLatestStub.calledTimes(12);

		transRepoStub.calledWith([block106data.id]);

		deleteBlockSpy.calledWith([block106data]);
		transRepoStub.calledWith([block105data.id]);

		deleteBlockSpy.calledWith([block105data]);
		transRepoStub.calledWith([block104data.id]);

		deleteBlockSpy.calledWith([block104data]);
		transRepoStub.calledWith([block103data.id]);

		deleteBlockSpy.calledWith([block103data]);
		transRepoStub.calledWith([block102data.id]);

		deleteBlockSpy.calledWith([block102data]);
		transRepoStub.calledWith([block101data.id]);

		appSpy.called();
	});
});

describe("DatabaseInteraction.restoreCurrentRound", ({ it, assert, spy }) => {
	it("should call roundState.restore", async () => {
		const roundStateSpy = spy(roundState, "restore");

		const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

		await databaseInteraction.restoreCurrentRound();

		roundStateSpy.called();

		roundStateSpy.restore();
	});
});

describe("DatabaseInteraction.reset", ({ it, assert, stub, spy }) => {
	it("should reset database", async () => {
		const genesisBlock = {};
		const connectionSpy = spy(connection, "query");
		const stateStoreStub = stub(stateStore, "getGenesisBlock").returnValueOnce(genesisBlock);
		const blockRepoSpy = spy(blockRepository, "saveBlocks");

		const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

		// @ts-ignore
		await databaseInteraction.reset();

		connectionSpy.calledWith("TRUNCATE TABLE blocks, rounds, transactions RESTART IDENTITY;");
		blockRepoSpy.calledWith([genesisBlock]);

		connectionSpy.restore();
		stateStoreStub.restore();
		blockRepoSpy.restore();
	});
});

describe("DatabaseInteraction.applyBlock", ({ it, assert, spy, stub }) => {
	it("should apply block, round, detect missing blocks, and fire events", async () => {
		const eventsStub = spy(events, "dispatch");
		const blockStateStub = spy(blockState, "applyBlock");
		const roundStateStub = spy(roundState, "applyBlock");
		const roundStateStub2 = spy(roundState, "detectMissedBlocks");

		const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

		const spied = spy();

		const handler = { emitEvents: spied };

		const handlerStub = stub(handlerRegistry, "getActivatedHandlerForData").returnValueOnce(handler);

		const transaction = { data: { id: "dummy_id" } };
		const block = { data: { height: 54, timestamp: 35 }, transactions: [transaction] };
		await databaseInteraction.applyBlock(block as any);

		roundStateStub2.calledWith(block);

		blockStateStub.calledWith(block);
		roundStateStub.calledWith(block);
		spied.calledWith(transaction, events);
		eventsStub.calledWith(Enums.TransactionEvent.Applied, transaction.data);
		eventsStub.calledWith(Enums.BlockEvent.Applied, block.data);

		eventsStub.restore();
		blockStateStub.restore();
		roundStateStub.restore();
		roundStateStub2.restore();
		spied.restore();
		handlerStub.restore();
	});
});

describe("DatabaseInteraction.revertBlock", ({ it, assert, stub, spy }) => {
	it("should revert state, and fire events", async () => {
		const eventsStub = spy(events, "dispatch");
		const blockStateStub = spy(blockState, "revertBlock");
		const roundStateStub = spy(roundState, "revertBlock");

		const databaseInteraction: DatabaseInteraction = container.resolve(DatabaseInteraction);

		const transaction1 = { data: {} };
		const transaction2 = { data: {} };
		const block = {
			data: { id: "123", height: 100 },
			transactions: [transaction1, transaction2],
		};

		await databaseInteraction.revertBlock(block as any);

		blockStateStub.calledWith(block);
		roundStateStub.calledWith(block);
		eventsStub.calledWith(Enums.TransactionEvent.Reverted, transaction1.data);
		eventsStub.calledWith(Enums.TransactionEvent.Reverted, transaction2.data);
		eventsStub.calledWith(Enums.BlockEvent.Reverted, block.data);

		eventsStub.restore();
		blockStateStub.restore();
		roundStateStub.restore();
	});
});
