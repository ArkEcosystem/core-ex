import { Console, describe } from "../../../core-test-framework";
import { DiscoverCommands } from "./discover-commands";
import { resolve } from "path";
import { setGracefulCleanup } from "tmp";

describe<{ DiscoverCommands; cmd: DiscoverCommands }>("DiscoverCommands", ({ beforeEach, afterAll, it, assert }) => {
	beforeEach((context) => {
		const cli = new Console();

		context.cmd = cli.app.resolve(DiscoverCommands);
	});

	afterAll(() => {
		setGracefulCleanup();
	});

	it("#within - should discover commands within the given directory", ({ cmd }) => {
		// const commandPath: string = resolve(__dirname, "../../../core/distribution/commands");
		const commandPath: string = resolve("../core/distribution/commands");

		const commands = cmd.within(commandPath);

		assert.object(commands);
		assert.gt(Object.keys(commands).length, 0);
	});

	it("#from - should not discover commands if no packages are passed in", ({ cmd }) => {
		const commands = cmd.from([]);

		assert.object(commands);
		assert.equal(Object.keys(commands).length, 0);
	});

	// it.skip("should discover commands within the given packages", () => {
	// 	const commandPath: string = resolve(__dirname, "./distribution");
	//
	// 	const commands = cmd.from([commandPath]);
	//
	// 	expect(commands).toBeObject();
	// 	expect(commands).toContainAllKeys(["help"]);
	// });
});
