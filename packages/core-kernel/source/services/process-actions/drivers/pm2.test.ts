import pmx from "@pm2/io";
import { describe } from "../../../../../core-test-framework";

import { ProcessAction } from "../../../contracts/kernel";
import { Pm2ProcessActionsService } from "./pm2";
import * as sinon from "sinon";

function mockModule<T extends { [K: string]: any }>(
	moduleToMock: T,
	defaultMockValuesForMock: Partial<{ [K in keyof T]: T[K] }>,
) {
	return (sandbox: sinon.SinonSandbox, returnOverrides?: Partial<{ [K in keyof T]: T[K] }>): void => {
		const functions = Object.keys(moduleToMock);
		const returns = returnOverrides || {};
		functions.forEach((f) => {
			sandbox.stub(moduleToMock, f).callsFake(returns[f] || defaultMockValuesForMock[f]);
		});
	};
}

class DummyProcessAction implements ProcessAction {
	public name = "dummy";

	public async handler() {
		return "dummy_response";
	}
}

describe<{
	sandbox: sinon.SinonSandbox;
	pm2: Pm2ProcessActionsService;
	dummyProcessAction: DummyProcessAction;
}>("Pm2ProcessActionsService", ({ afterEach, assert, beforeEach, it, spyFn, stub }) => {
	afterEach((context) => {
		context.sandbox.restore();
	});
	beforeEach((context) => {
		context.sandbox = sinon.createSandbox();

		let callback: Function;
		mockModule(pmx, {
			action: function (name: string, cb: Function) {
				callback = cb;
			},

			// @ts-ignore
			runAction: async function (reply: any) {
				await callback!(reply);
			},
		});

		context.pm2 = new Pm2ProcessActionsService();

		context.dummyProcessAction = new DummyProcessAction();
	});

	it("should register action", async (context) => {
		assert.resolves(() => context.pm2.register(context.dummyProcessAction));
	});

	it("should run action and return response", async (context) => {
		context.pm2.register(context.dummyProcessAction);

		const reply = spyFn();

		// @ts-ignore
		await pmx.runAction(reply);

		assert.true(reply.calledWith({ response: "dummy_response" }));
	});

	it("should run action and return error", async (context) => {
		stub(context.dummyProcessAction, "handler").callsFake(async () => {
			throw new Error();
		});

		context.pm2.register(context.dummyProcessAction);

		const reply = spyFn();

		// @ts-ignore
		await pmx.runAction(reply);

		assert.true(
			reply.calledWith(
				sinon.match({
					error: expect.toBeString(),
				}),
			),
		);
	});
});
