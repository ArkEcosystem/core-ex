import { describe } from "@arkecosystem/core-test-framework";
import { Ora, Options as OraOptions } from "ora";

import { ProcessIdentifier } from "../contracts";
import { Spinner } from "../components";
import { Container, Identifiers } from "../ioc";
import { ProcessManager } from "../services";
import { AbortUnknownProcess } from "./abort-unknown-process";
import { AbortRunningProcess } from "./abort-running-process";
import { DaemonizeProcess } from "./daemonize-process";

describe<{
	action: DaemonizeProcess;
}>("DaemonizeProcess", ({ beforeEach, it, assert, stub, spy }) => {
	const options = {
		name: "ark-core",
		script: "script",
		args: "core:run --daemon",
	}

	const processManager: Partial<ProcessManager> = {
		has: (id: ProcessIdentifier) => false,
		isUnknown: (id: ProcessIdentifier) => false
	};

	const abortUnknownProcess: Partial<AbortUnknownProcess> = {
		execute: (processName: string) => {},
	};

	const abortRunningProcess: Partial<AbortRunningProcess> = {
		execute: (processName: string) => {},
	};

	const ora: Partial<Ora> = {
		stop: () => this,
	};

	const spinner: Spinner = {
		render: (options?: string | OraOptions | undefined): Ora => ora as Ora,
	};

	beforeEach((context) => {
		const app = new Container();
		app.bind(Identifiers.Application).toConstantValue(app);
		app.bind(Identifiers.ProcessManager).toConstantValue(processManager);
		app.bind(Identifiers.AbortUnknownProcess).toConstantValue(abortUnknownProcess);
		app.bind(Identifiers.AbortRunningProcess).toConstantValue(abortRunningProcess);
		app.bind(Identifiers.Spinner).toConstantValue(spinner);
		context.action = app.resolve(DaemonizeProcess);
	});

	it("should throw if the process has entered an unknown state", ({ action }) => {
		const spyOnHas = stub(processManager, "has").returnValue(true)
		const spyOnAbortUnknownProcessExecute = stub(abortUnknownProcess, "execute").callsFake(() => {
			throw new Error("Unknown")
		});

		assert.throws(() => action.execute(
			options,
			{},
		), "Unknown")

		spyOnHas.calledOnce();
		spyOnAbortUnknownProcessExecute.calledOnce();
	});

	it("should throw if the process is running", ({ action }) => {
		const spyOnHas = stub(processManager, "has").returnValue(true)
		const spyOnAbortRunningProcessExecute = stub(abortRunningProcess, "execute").callsFake(() => {
			throw new Error("Running")
		});

		assert.throws(() => action.execute(
			options,
			{},
		), "Running")
		spyOnHas.calledOnce();
		spyOnAbortRunningProcessExecute.calledOnce();
	});

	// it("should start process", ({ action }) => {
	// 	assert.throws(() => action.execute(
	// 		options,
	// 		{},
	// 	), "Running")
	//
	// 	const spyOnHas = spy(processManager, "has")
	// });

	// it("should not throw if the process is not unknown", ({ action }) => {
	// 	const spyIsErrored = stub(processManager, "isUnknown").returnValue(false);
	//
	// 	action.execute(processName);1
	// 	spyIsErrored.calledOnce();
	// });
	//
	// it("should throw if the process is unknown", ({ action }) => {
	// 	const spyIsErrored = stub(processManager, "isUnknown").returnValue(true);
	//
	// 	assert.throws(() => {action.execute(processName)},`The "${processName}" process has entered an unknown state.`);
	// 	spyIsErrored.calledOnce();
	// });
});
