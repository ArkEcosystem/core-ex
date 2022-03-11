import { Enums } from "@arkecosystem/core-kernel";
import { Container } from "@arkecosystem/core-container";
import { Identifiers } from "@arkecosystem/core-contracts";
import { describe } from "../../../../core-test-framework";

import { BlockchainReady } from "./blockchain-ready";

describe<{
	container: Container;
	logService: any;
	stateStore: any;
	eventDispatcher: any;
	application: any;
}>("BlockchainReady", ({ beforeEach, it, spy, stub }) => {
	beforeEach((context) => {
		context.logService = {
			warning: () => undefined,
			info: () => undefined,
			error: () => undefined,
			debug: () => undefined,
		};
		context.stateStore = {
			isStarted: () => false,
			setStarted: () => undefined,
		};
		context.eventDispatcher = {
			dispatch: () => undefined,
		};
		context.application = {
			resolve: () => undefined,
		};

		context.container = new Container();
		context.container.bind(Identifiers.Application).toConstantValue(context.application);
		context.container.bind(Identifiers.LogService).toConstantValue(context.logService);
		context.container.bind(Identifiers.StateStore).toConstantValue(context.stateStore);
		context.container.bind(Identifiers.EventDispatcherService).toConstantValue(context.eventDispatcher);
	});

	it("should set stateStore.started = true and dispatch started event", (context) => {
		const blockchainReady = context.container.resolve<BlockchainReady>(BlockchainReady);

		stub(context.stateStore, "isStarted").returnValue(false);
		const setStartedSpy = spy(context.stateStore, "setStarted");
		const dispatchSpy = spy(context.eventDispatcher, "dispatch");
		blockchainReady.handle();

		setStartedSpy.calledWith(true);
		dispatchSpy.calledOnce();
		dispatchSpy.calledWith(Enums.StateEvent.Started, true);
	});

	it("should do nothing if stateStore.started is true", (context) => {
		const blockchainReady = context.container.resolve<BlockchainReady>(BlockchainReady);

		const dispatchSpy = spy(context.eventDispatcher, "dispatch");

		stub(context.stateStore, "isStarted").returnValue(true);
		blockchainReady.handle();

		dispatchSpy.neverCalled();
	});
});
