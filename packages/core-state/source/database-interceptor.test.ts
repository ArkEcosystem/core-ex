import { DatabaseService } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import { DatabaseInterceptor } from "./database-interceptor";
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
	getLastBlocks: () => undefined,
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

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(app);
container.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);
container.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(blockRepository);
container.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);
container.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue(roundRepository);
container.bind(Container.Identifiers.DatabaseService).to(DatabaseService).inSingletonScope();
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

describe("DatabaseInterceptor.getBlock", ({ it, assert, stub }) => {
	it("should return block from state store", async () => {
		const databaseInterceptor: DatabaseInterceptor = container.resolve(DatabaseInterceptor);

		const block = { data: { id: "block_id", height: 100, transactions: [] } };

		stub(stateStore, "getLastBlocks").returnValue([block]);

		assert.equal(await databaseInterceptor.getBlock("block_id"), block);
	});

	it("should return block from database", async () => {
		const databaseInterceptor: DatabaseInterceptor = container.resolve(DatabaseInterceptor);
		const databaseService = container.get<DatabaseService>(Container.Identifiers.DatabaseService);

		const block = { data: { id: "block_id", height: 100, transactions: [] } };

		stub(stateStore, "getLastBlocks").returnValue([]);
		stub(databaseService, "getBlock").returnValue(block);

		assert.equal(await databaseInterceptor.getBlock("block_id"), block);
	});
});

describe("DatabaseInterceptor.getCommonBlocks", ({ it, assert, stub }) => {
	it("should return blocks by ids", async () => {
		const databaseInterceptor: DatabaseInterceptor = container.resolve(DatabaseInterceptor);

		const block100 = { id: "00100", height: 100, transactions: [] };
		const block101 = { id: "00101", height: 101, transactions: [] };
		const block102 = { id: "00102", height: 102, transactions: [] };

		const commonBlockStub = stub(stateStore, "getCommonBlocks").returnValue([block101, block102]);
		const findByIdsStub = stub(blockRepository, "findByIds").returnValue([block100, block101, block102]);

		const result = await databaseInterceptor.getCommonBlocks([block100.id, block101.id, block102.id]);

		commonBlockStub.calledWith([block100.id, block101.id, block102.id]);
		findByIdsStub.calledWith([block100.id, block101.id, block102.id]);
		assert.equal(result, [block100, block101, block102]);
	});
});

describe("DatabaseInterceptor.getBlocksByHeight", ({ it, assert, stub }) => {
	it("should return blocks with transactions when full blocks are requested", async () => {
		const databaseInterceptor: DatabaseInterceptor = container.resolve(DatabaseInterceptor);

		const block100 = { height: 100, transactions: [] };
		const block101 = { height: 101, transactions: [] };
		const block102 = { height: 102, transactions: [] };

		const getLastBlockStub = stub(stateStore, "getLastBlocksByHeight");

		getLastBlockStub.returnValueNth(0, [block100]);
		getLastBlockStub.returnValueNth(1, []);
		getLastBlockStub.returnValueNth(2, [block102]);

		const blockRepoStub = stub(blockRepository, "findByHeights").returnValueOnce([block101]);

		const result = await databaseInterceptor.getBlocksByHeight([100, 101, 102]);

		getLastBlockStub.calledNthWith(0, 100, 100, true);
		getLastBlockStub.calledNthWith(1, 101, 101, true);
		getLastBlockStub.calledNthWith(2, 102, 102, true);

		blockRepoStub.calledWith([101]);

		assert.equal(result, [block100, block101, block102]);
	});
});
