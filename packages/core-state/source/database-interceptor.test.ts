import { DatabaseInterceptor } from "./";
import { Application, Container} from "@arkecosystem/core-kernel";
import { describe } from "@arkecosystem/core-test-framework";
import { setUp } from "../test/setup";
import { StateStore } from "./stores";
import { DatabaseService } from "@arkecosystem/core-database";

let stateStore: StateStore;
let app;

describe("DatabaseInterceptor.getBlock", ({ it, assert, stub, spy, beforeAll }) => {
	beforeAll(async () => {
		const initialEnv = await setUp();

		app = initialEnv.sandbox.app;
		app.bind(Container.Identifiers.DatabaseService).toConstantValue(DatabaseService);
		app.bind(Container.Identifiers.DatabaseInterceptor).toConstantValue(DatabaseInterceptor);
		
		stateStore = initialEnv.stateStore;
	});

	it("should return block from state store", async () => {
		const databaseInterceptor: DatabaseInterceptor = app.resolve(Container.Identifiers.DatabaseInterceptor);
		
		const block = { data: { id: "block_id", height: 100, transactions: [] } };
		
		const stateStoreStub = stub(stateStore, "getLastBlocks").returnValue([block]);
		
		assert.equal(await databaseInterceptor.getBlock("block_id"), block);

		stateStoreStub.restore();
	});

	// it("should return block from database", async () => {
	// 	const databaseService = app.resolve(Container.Identifiers.DatabaseService);
	// 	const databaseInterceptor: DatabaseInterceptor = app.resolve(Container.Identifiers.DatabaseInterceptor);

	// 	const block = { data: { id: "block_id", height: 100, transactions: [] } };

	// 	const stateStoreStub = stub(stateStore, "getLastBlocks").returnValue([]);
	// 	const databaseServiceStub = stub(databaseService, "getBlock").returnValue(block);
		
	// 	assert.equal(await databaseInterceptor.getBlock("block_id"), block);

	// 	stateStoreStub.restore();
	// 	databaseServiceStub.restore();
	// });
});

// describe("DatabaseInterceptor.getCommonBlocks", () => {
// 	it("should return blocks by ids", async () => {
// 		const databaseInterceptor: DatabaseInterceptor = container.resolve(DatabaseInterceptor);

// 		const block100 = { id: "00100", height: 100, transactions: [] };
// 		const block101 = { id: "00101", height: 101, transactions: [] };
// 		const block102 = { id: "00102", height: 102, transactions: [] };

// 		stateStore.getCommonBlocks.mockReturnValueOnce([block101, block102]);
// 		blockRepository.findByIds.mockResolvedValueOnce([block100, block101, block102]);

// 		const result = await databaseInterceptor.getCommonBlocks([block100.id, block101.id, block102.id]);

// 		expect(stateStore.getCommonBlocks).toBeCalledWith([block100.id, block101.id, block102.id]);
// 		expect(blockRepository.findByIds).toBeCalledWith([block100.id, block101.id, block102.id]);
// 		expect(result).toEqual([block100, block101, block102]);
// 	});
// });

// describe("DatabaseInterceptor.getBlocksByHeight", () => {
// 	it("should return blocks with transactions when full blocks are requested", async () => {
// 		const databaseInterceptor: DatabaseInterceptor = container.resolve(DatabaseInterceptor);

// 		const block100 = { height: 100, transactions: [] };
// 		const block101 = { height: 101, transactions: [] };
// 		const block102 = { height: 102, transactions: [] };

// 		stateStore.getLastBlocksByHeight.mockReturnValueOnce([block100]);
// 		stateStore.getLastBlocksByHeight.mockReturnValueOnce([]);
// 		stateStore.getLastBlocksByHeight.mockReturnValueOnce([block102]);

// 		blockRepository.findByHeights.mockResolvedValueOnce([block101]);

// 		const result = await databaseInterceptor.getBlocksByHeight([100, 101, 102]);

// 		expect(stateStore.getLastBlocksByHeight).toBeCalledWith(100, 100, true);
// 		expect(stateStore.getLastBlocksByHeight).toBeCalledWith(101, 101, true);
// 		expect(stateStore.getLastBlocksByHeight).toBeCalledWith(102, 102, true);
// 		expect(blockRepository.findByHeights).toBeCalledWith([101]);
// 		expect(result).toEqual([block100, block101, block102]);
// 	});
// });
