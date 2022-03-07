import { Console, describe } from "@arkecosystem/core-test-framework";
import envPaths, { Paths } from "env-paths";

import { Command } from "./env-paths";

describe<{
	cli: Console;
}>("PathsCommand", ({ beforeEach, it, stub, assert }) => {
	beforeEach((context) => {
		context.cli = new Console();
	});

	it("should list all system paths", async ({ cli }) => {
		let message: string;
		stub(console, "log").callsFake((m) => (message = m));

		await cli.execute(Command);

		const paths: Paths = envPaths("ark", { suffix: "core" });

		assert.true(message.includes(paths.cache));
		assert.true(message.includes(paths.config));
		assert.true(message.includes(paths.data));
		assert.true(message.includes(paths.log));
		assert.true(message.includes(paths.temp));
	});
});