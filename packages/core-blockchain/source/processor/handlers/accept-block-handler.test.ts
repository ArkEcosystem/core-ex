import { Container } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import { describe } from "../../../../core-test-framework";

import { BlockProcessorResult } from "../block-processor";
import { AcceptBlockHandler } from "./accept-block-handler";

describe<{
	container: Container.Container;
	logger: any;
	blockchain: any;
	state: any;
	transactionPool: any;
	databaseInteractions: any;
	revertBlockHandler: any;
	application: any;
	block: any;
}>("AcceptBlockHandler", ({ assert, beforeEach, it, spy, spyFn, stub }) => {
	beforeEach((context) => {
		context.logger = {
			warning: () => undefined,
			debug: () => undefined,
			info: () => undefined,
		};
		context.blockchain = {
			resetLastDownloadedBlock: () => undefined,
			resetWakeUp: () => undefined,
		};
		context.state = {
			setLastBlock: () => undefined,
			getLastBlock: () => undefined,
			getLastDownloadedBlock: () => undefined,
			setLastDownloadedBlock: () => undefined,
			isStarted: () => false,
			getForkedBlock: () => undefined,
			setForkedBlock: () => undefined,
			clearForkedBlock: () => undefined,
		};
		context.transactionPool = {
			removeForgedTransaction: () => undefined,
		};
		context.databaseInteractions = {
			walletRepository: {
				getNonce: () => undefined,
			},
			applyBlock: () => undefined,
			getTopBlocks: () => undefined,
			getLastBlock: () => undefined,
			loadBlocksFromCurrentRound: () => undefined,
			revertBlock: () => undefined,
			deleteRound: () => undefined,
			getActiveDelegates: () => [],
		};
		context.revertBlockHandler = {
			execute: () => undefined,
		};
		context.application = {
			get: () => undefined,
			resolve: () => undefined,
		};
		context.block = {
			data: { id: "1222", height: 5544 },
			transactions: [{ id: "11" }, { id: "12" }],
		};

		context.container = new Container.Container();
		context.container.bind(Container.Identifiers.Application).toConstantValue(context.application);
		context.container.bind(Container.Identifiers.LogService).toConstantValue(context.logger);
		context.container.bind(Container.Identifiers.BlockchainService).toConstantValue(context.blockchain);
		context.container.bind(Container.Identifiers.StateStore).toConstantValue(context.state);
		context.container.bind(Container.Identifiers.DatabaseInteraction).toConstantValue(context.databaseInteractions);
		context.container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(context.transactionPool);
	});

	it.only("execute should apply block to database, transaction pool, blockchain and state", async (context) => {
		const acceptBlockHandler = context.container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

		stub(context.state, "isStarted").returnValue(true);
		// stub(context.state, "getForkedBlock").returnValue(context.block);
		const applyBlockSpy = spy(context.databaseInteractions, "applyBlock");
		const resetWakeUpSpy = spy(context.blockchain, "resetWakeUp");
		const removeForgedTransactionSpy = spy(context.transactionPool, "removeForgedTransaction");

		const result = await acceptBlockHandler.execute(context.block as Interfaces.IBlock);

		assert.is(result, BlockProcessorResult.Accepted);
		applyBlockSpy.calledOnce();
		applyBlockSpy.calledWith(context.block);
		resetWakeUpSpy.calledOnce();
		removeForgedTransactionSpy.calledTimes(2);
		removeForgedTransactionSpy.calledWith(context.block.transactions[0]);
		removeForgedTransactionSpy.calledWith(context.block.transactions[1]);
	});

	it("execute should clear forkedBlock if incoming block has same height", async (context) => {
		const acceptBlockHandler = context.container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

		context.state.getForkedBlock = jest.fn().mockReturnValue({ data: { height: context.block.data.height } });
		const result = await acceptBlockHandler.execute(context.block as Interfaces.IBlock);

		assert.is(result, BlockProcessorResult.Accepted);

		expect(context.state.clearForkedBlock).toHaveBeenCalled();
	});

	it("execute should set state.lastDownloadedBlock if incoming block height is higher", async (context) => {
		const acceptBlockHandler = context.container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

		context.state.getLastDownloadedBlock = jest.fn().mockReturnValue({ height: context.block.data.height - 1 });
		const result = await acceptBlockHandler.execute(context.block as Interfaces.IBlock);

		assert.is(result, BlockProcessorResult.Accepted);

		expect(context.state.setLastDownloadedBlock).toHaveBeenCalledWith(context.block.data);
		expect(context.state.setLastDownloadedBlock).toHaveBeenCalledTimes(1);
	});

	it("revert should call revertBlockHandler when block is accepted, but execute throws", async (context) => {
		context.revertBlockHandler.execute.mockReturnValue(BlockProcessorResult.Reverted);
		context.application.resolve.mockReturnValue(context.revertBlockHandler);
		context.state.getLastBlock.mockReturnValue({ data: { height: 5544 } });

		const acceptBlockHandler = context.container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

		context.databaseInteractions.applyBlock = jest.fn().mockRejectedValueOnce(new Error("oops"));
		const result = await acceptBlockHandler.execute(context.block as Interfaces.IBlock);

		assert.is(result, BlockProcessorResult.Rejected);

		expect(context.blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
		expect(context.revertBlockHandler.execute).toBeCalledTimes(1);
	});

	it("revert should call not revertBlockHandler when block not accepted and execute throws", async (context) => {
		context.revertBlockHandler.execute.mockReturnValue(BlockProcessorResult.Reverted);
		context.state.getLastBlock.mockReturnValue({ data: { height: 5543 } }); // Current block was not accpeted

		const acceptBlockHandler = context.container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

		context.databaseInteractions.applyBlock = jest.fn().mockRejectedValueOnce(new Error("oops"));
		const result = await acceptBlockHandler.execute(context.block as Interfaces.IBlock);

		assert.is(result, BlockProcessorResult.Rejected);

		expect(context.blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
		expect(context.revertBlockHandler.execute).not.toBeCalled();
	});

	it("revert should return Corrupted when reverting block fails", async (context) => {
		context.revertBlockHandler.execute.mockReturnValue(BlockProcessorResult.Corrupted);
		context.application.resolve.mockReturnValue(context.revertBlockHandler);
		context.state.getLastBlock.mockReturnValue({ data: { height: 5544 } });

		const acceptBlockHandler = context.container.resolve<AcceptBlockHandler>(AcceptBlockHandler);

		context.databaseInteractions.applyBlock = jest.fn().mockRejectedValueOnce(new Error("oops"));
		const result = await acceptBlockHandler.execute(context.block as Interfaces.IBlock);

		assert.is(result, BlockProcessorResult.Corrupted);

		expect(context.blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
		expect(context.revertBlockHandler.execute).toBeCalledTimes(1);
	});
});
