import { describe } from "@arkecosystem/core-test-framework";
import { Options as OraOptions, Ora } from "ora";

import { Spinner } from "../components";
import { ProcessIdentifier } from "../contracts";
import { Container, Identifiers } from "../ioc";
import { ProcessManager } from "../services";
import { RestartProcess } from "./restart-process";

describe<{
	action: RestartProcess;
}>("RestartProcess", ({ beforeEach, it, assert, stub, spy }) => {
	const processName = "ark-core";

	const processManager: Partial<ProcessManager> = {
		restart: (id: ProcessIdentifier): any => {},
	};

	const ora: Partial<Ora> = {
		stop: () => this,
	};

	const spinner: Spinner = {
		render: (options?: string | OraOptions | undefined): Ora => ora as Ora,
	};

	const spyOnSpinnerRender = spy(spinner, "render");
	const spyOnSpinnerStop = spy(ora, "stop");

	beforeEach((context) => {
		spyOnSpinnerRender.resetHistory();
		spyOnSpinnerStop.resetHistory();

		const app = new Container();
		app.bind(Identifiers.Application).toConstantValue(app);
		app.bind(Identifiers.ProcessManager).toConstantValue(processManager);
		app.bind(Identifiers.Spinner).toConstantValue(spinner);
		context.action = app.resolve(RestartProcess);
	});

	it("should restart process", ({ action }) => {
		const spyOnRestart = spy(processManager, "restart");

		action.execute(processName);

		assert.true(spyOnRestart.calledOnce);
		// TODO: Called with
		assert.true(spyOnSpinnerRender.calledOnce);
		assert.true(spyOnSpinnerStop.calledOnce);

		spyOnRestart.restore();
	});

	it("should throw", ({ action }) => {
		const spyOnRestart = stub(processManager, "restart").callsFake(() => {
			throw new Error("Dummy error");
		});

		assert.throws(() => {
			action.execute(processName);
		}, "Dummy error");
		spyOnRestart.calledOnce();

		assert.true(spyOnSpinnerRender.calledOnce);
		assert.true(spyOnSpinnerStop.calledOnce);
	});

	it("should throw with stderr", ({ action }) => {
		const spyOnRestart = stub(processManager, "restart").callsFake(() => {
			const error: Error = new Error("Dummy error");
			// @ts-ignore
			error.stderr = "error output";
			throw error;
		});

		assert.throws(() => {
			action.execute(processName);
		}, "Dummy error: error output");
		spyOnRestart.calledOnce();

		assert.true(spyOnSpinnerRender.calledOnce);
		assert.true(spyOnSpinnerStop.calledOnce);
	});
});
