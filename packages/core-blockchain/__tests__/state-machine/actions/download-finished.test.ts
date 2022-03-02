import { Container } from "@arkecosystem/core-kernel";
import { DownloadFinished } from "@packages/core-blockchain/source/state-machine/actions/download-finished";

describe("DownloadFinished", () => {
	const container = new Container.Container();

	const blockchain = { dispatch: jest.fn(), getQueue: jest.fn() };
	const stateStore = { getNetworkStart: jest.fn().mockReturnValue(false), setNetworkStart: jest.fn() };
	const logger = { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() };

	const application = { resolve: jest.fn() };

	beforeAll(() => {
		container.unbindAll();
		container.bind(Identifiers.Application).toConstantValue(application);
		container.bind(Identifiers.BlockchainService).toConstantValue(blockchain);
		container.bind(Identifiers.StateStore).toConstantValue(stateStore);
		container.bind(Identifiers.LogService).toConstantValue(logger);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe("handle", () => {
		it("should dispatch SYNCFINISHED when stateStore.networkStart", async () => {
			const downloadFinished = container.resolve<DownloadFinished>(DownloadFinished);

			stateStore.getNetworkStart = jest.fn().mockReturnValue(true);
			await downloadFinished.handle();

			expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
			expect(blockchain.dispatch).toHaveBeenCalledWith("SYNCFINISHED");
			expect(stateStore.setNetworkStart).toHaveBeenCalledWith(false);
		});

		it("should dispatch PROCESSFINISHED when !blockchain.getQueue.isRunning()", async () => {
			const downloadFinished = container.resolve<DownloadFinished>(DownloadFinished);

			blockchain.getQueue = jest.fn().mockReturnValueOnce({
				isRunning: jest.fn().mockReturnValue(false),
			});
			await downloadFinished.handle();

			expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
			expect(blockchain.dispatch).toHaveBeenCalledWith("PROCESSFINISHED");
		});

		it("should dispatch nothing when blockchain.getQueue.isRunning()", async () => {
			const downloadFinished = container.resolve<DownloadFinished>(DownloadFinished);

			blockchain.getQueue = jest.fn().mockReturnValueOnce({
				isRunning: jest.fn().mockReturnValue(true),
			});
			await downloadFinished.handle();

			expect(blockchain.dispatch).toHaveBeenCalledTimes(0);
		});
	});
});
