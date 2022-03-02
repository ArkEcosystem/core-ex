import { Container } from "@packages/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { RestartProcess } from "@packages/core-cli/source/actions";

const processName: string = "ark-core";

let cli;
let processManager;
let action;

beforeEach(() => {
	cli = new Console();
	processManager = cli.app.get(Identifiers.ProcessManager);

	// Bind from src instead of dist to collect coverage.
	cli.app.rebind(Identifiers.RestartProcess).to(RestartProcess).inSingletonScope();
	action = cli.app.get(Identifiers.RestartProcess);
});

describe("RestartProcess", () => {
	it("should restart the process", async () => {
		const spy = jest.spyOn(processManager, "restart").mockImplementation(undefined);

		action.execute(processName);

		expect(spy).toHaveBeenCalledWith(processName);

		spy.mockClear();
	});

	it("should throw if the process does not exist", async () => {
		const spy = jest.spyOn(processManager, "restart").mockImplementation(() => {
			throw new Error("hello world");
		});

		expect(() => action.execute(processName)).toThrow("hello world");
		expect(spy).toHaveBeenCalled();

		spy.mockClear();
	});

	it("should throw if the process does not exist (with stderr)", async () => {
		const spy = jest.spyOn(processManager, "restart").mockImplementation(() => {
			const error: Error = new Error("hello world");
			// @ts-ignore
			error.stderr = "error output";

			throw error;
		});

		expect(() => action.execute(processName)).toThrow("hello world: error output");
		expect(spy).toHaveBeenCalled();

		spy.mockClear();
	});
});
