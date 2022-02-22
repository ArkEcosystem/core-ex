import { describe } from "@arkecosystem/core-test-framework";

import { ProcessIdentifier } from "../contracts";
import { Container, Identifiers } from "../ioc";
import { ProcessManager } from "../services";
import { AbortErroredProcess } from "./abort-errored-process";

describe<{
	action: AbortErroredProcess;
}>("AbortErroredProcess", ({ beforeEach, it, assert, stub }) => {
	const processName = "ark-core";

	const processManager: Partial<ProcessManager> = {
		isErrored: (id: ProcessIdentifier) => false,
	};

	beforeEach((context) => {
		const app = new Container();
		app.bind(Identifiers.ProcessManager).toConstantValue(processManager);
		context.action = app.resolve(AbortErroredProcess);
	});

	it("should not throw if the process does exist", ({ action }) => {
		const spyIsErrored = stub(processManager, "isErrored").returnValue(false);

		action.execute(processName);
		spyIsErrored.calledOnce();
	});

	it("should throw if the process does not exist", ({ action }) => {
		const spyIsErrored = stub(processManager, "isErrored").returnValue(true);

		// assert.throws(() => {action.execute(processName)},`The "${processName}" process has errored.`);
		assert.throws(() => action.execute(processName),`Invalid error message`);
		spyIsErrored.calledOnce();
	});
});
