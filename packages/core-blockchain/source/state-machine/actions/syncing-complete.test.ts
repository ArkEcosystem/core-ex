import { Container } from "@arkecosystem/core-container";
import { Identifiers } from "@arkecosystem/core-contracts";
import { describe } from "../../../../core-test-framework";

import { SyncingComplete } from "./syncing-complete";

describe<{
	container: Container;
	logger: any;
	blockchain: any;
	application: any;
}>("Syncing Complete", ({ beforeEach, it, spy }) => {
	beforeEach((context) => {
		context.logger = {
			warning: () => undefined,
			debug: () => undefined,
			info: () => undefined,
		};
		context.blockchain = {
			dispatch: () => undefined,
		};
		context.application = {
			get: () => undefined,
		};

		context.container = new Container();
		context.container.bind(Identifiers.Application).toConstantValue(context.application);
		context.container.bind(Identifiers.LogService).toConstantValue(context.logger);
		context.container.bind(Identifiers.BlockchainService).toConstantValue(context.blockchain);
	});

	it("should dispatch SYNCFINISHED", (context) => {
		const syncingComplete = context.container.resolve<SyncingComplete>(SyncingComplete);

		const dispatchSpy = spy(context.blockchain, "dispatch");

		syncingComplete.handle();

		dispatchSpy.calledOnce();
		dispatchSpy.calledWith("SYNCFINISHED");
	});
});
