import { describe } from "@arkecosystem/core-test-framework";

import { ProcessIdentifier } from "../contracts";
import { Container, Identifiers } from "../ioc";
import { Prompt } from "../components";
import { ProcessManager } from "../services";
import { RestartProcess } from "./restart-process";
import { RestartRunningProcessWithPrompt } from "./restart-running-process-with-prompt";

describe<{
	action: RestartRunningProcessWithPrompt;
}>("RestartRunningProcessWithPrompt", ({ beforeEach, it, assert, stub, spy }) => {
	const processName = "ark-core";

	const processManager: Partial<ProcessManager> = {
		isOnline: (id: ProcessIdentifier) => false,
	};

	const restartProcess: Partial<RestartProcess> = {
		execute: (processName: string) => {},
	};

	const prompt: Partial<Prompt> = {
		render: async (options: object): Promise<{ confirm: boolean }> => {
			return {
				confirm: false,
			};
		},
	};

	const spyOnExecute = spy(restartProcess, "execute");

	beforeEach((context) => {
		spyOnExecute.resetHistory();

		const app = new Container();
		app.bind(Identifiers.Application).toConstantValue(app);
		app.bind(Identifiers.ProcessManager).toConstantValue(processManager);
		app.bind(Identifiers.RestartProcess).toConstantValue(restartProcess);
		app.bind(Identifiers.Prompt).toConstantValue(prompt);
		context.action = app.resolve(RestartRunningProcessWithPrompt);
	});

	it("should not restart the process if it is not online", async ({ action }) => {
		const spyIsOnline = stub(processManager, "isOnline").returnValue(false);
		const spyRender = spy(prompt, "render");

		await action.execute(processName);

		assert.equal(spyOnExecute.callCount, 0);
		spyIsOnline.calledOnce();
		assert.equal(spyRender.callCount, 0);

		spyRender.restore();
	});

	it("should not restart the process if it is not confirmed", async ({ action }) => {
		const spyIsOnline = stub(processManager, "isOnline").returnValue(true);
		const spyRender = stub(prompt, "render").resolvedValue({ confirm: false });

		await action.execute(processName);

		assert.equal(spyOnExecute.callCount, 0);
		spyIsOnline.calledOnce();
		spyRender.calledOnce();
	});

	it("should restart the process", async ({ action }) => {
		const spyIsOnline = stub(processManager, "isOnline").returnValue(true);
		const spyRender = stub(prompt, "render").resolvedValue({ confirm: true });

		await action.execute(processName);

		assert.true(spyOnExecute.calledOnce);
		spyIsOnline.calledOnce();
		spyRender.calledOnce();
	});
});
