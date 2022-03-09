import { Container } from "@arkecosystem/core-kernel";
import { describe, Sandbox } from "../../../core-test-framework";
import delay from "delay";

import { blockchainMachine } from "./machine";
import { StateMachine } from "./state-machine";

let sandbox: Sandbox;

describe<{
	sandbox: Sandbox;
	logService: any;
	stateStore: any;
}>("State machine", ({ assert, beforeEach, it, spy, spyFn, stub }) => {
	beforeEach((context) => {
		context.logService = {
			warning: () => undefined,
			info: () => undefined,
			error: () => undefined,
			debug: () => undefined,
		};
		context.stateStore = {
			getBlockchain: () => ({ value: undefined }),
			setBlockchain: () => undefined,
		};

		sandbox = new Sandbox();
		sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(context.logService);
		sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(context.stateStore);
	});

	it("should use blockchainMachine.transition to get next state and return it", (context) => {
		const stateMachine = sandbox.app.resolve<StateMachine>(StateMachine);

		const mockNextState = { state: "next", actions: [] };
		stub(blockchainMachine, "transition").returnValue(mockNextState);
		const nextState = stateMachine.transition("EVENT");

		assert.equal(nextState, mockNextState);
	});

	it("when there are actions associated to the next state should log an error if the action cannot be resolved", (context) => {
		const stateMachine = sandbox.app.resolve<StateMachine>(StateMachine);

		const nextAction = {
			type: "dothis",
		};
		const mockNextState = { state: "next", actions: [nextAction] };
		stub(blockchainMachine, "transition").returnValue(mockNextState);
		const errorLogSpy = spy(context.logService, "error");

		const nextState = stateMachine.transition("EVENT");

		assert.equal(nextState, mockNextState);
		errorLogSpy.calledOnce();
		errorLogSpy.calledWith(`No action '${nextAction.type}' found`);
	});

	it("when there are actions associated to the next state should execute the action", async (context) => {
		const stateMachine = sandbox.app.resolve<StateMachine>(StateMachine);

		const nextAction = {
			type: "dothis",
		};
		const mockNextState = { state: "next", actions: [nextAction] };
		stub(blockchainMachine, "transition").returnValue(mockNextState);
		const handle = spyFn();
		stub(sandbox.app, "resolve").returnValue({ handle });

		const nextState = stateMachine.transition("EVENT");
		await delay(100); // just to give time for setImmediate to launch

		assert.equal(nextState, mockNextState);
		assert.true(handle.calledOnce);
	});

	it("should return state if defined", (context) => {
		const stateMachine = sandbox.app.resolve<StateMachine>(StateMachine);

		stub(context.stateStore, "getBlockchain").returnValue({
			value: "dummy_state",
		});

		assert.equal(stateMachine.getState(), "dummy_state");
	});

	it("should return undefined if state is not set", (context) => {
		const stateMachine = sandbox.app.resolve<StateMachine>(StateMachine);

		stub(context.stateStore, "getBlockchain").returnValue({});

		assert.undefined(stateMachine.getState());
	});
});
