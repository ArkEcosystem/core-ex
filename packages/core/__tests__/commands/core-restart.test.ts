import { Command } from "@packages/core/source/commands/core-restart";
import { Console } from "@packages/core-test-framework";

let cli;
let processManager;
beforeEach(() => {
	cli = new Console();
	processManager = cli.app.get(Identifiers.ProcessManager);
});

describe("RestartCommand", () => {
	it("should throw if the process does not exist", async () => {
		const missing = jest.spyOn(processManager, "missing").mockReturnValue(true);
		const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);

		await expect(cli.execute(Command)).rejects.toThrowError('The "ark-core" process does not exist.');

		missing.mockReset();
		isStopped.mockReset();
	});

	it("should throw if the process is stopped", async () => {
		const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
		const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(true);

		await expect(cli.execute(Command)).rejects.toThrowError('The "ark-core" process is not running.');

		missing.mockReset();
		isStopped.mockReset();
	});

	it("should restart the process", async () => {
		const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);
		const isStopped = jest.spyOn(processManager, "isStopped").mockReturnValue(false);
		const restart = jest.spyOn(processManager, "restart").mockImplementation();

		await cli.execute(Command);

		expect(restart).toHaveBeenCalled();

		missing.mockReset();
		isStopped.mockReset();
		restart.mockReset();
	});
});
