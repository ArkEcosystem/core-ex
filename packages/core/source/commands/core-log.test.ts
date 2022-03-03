import { Console, describe } from "@arkecosystem/core-test-framework";

import { Command } from "./core-log";

describe<{
	cli: Console;
}>("LogCommand", ({ beforeEach, it, assert }) => {
	beforeEach((context) => {
		context.cli = new Console();
	});

	it("should throw if the process does not exist", async ({ cli }) => {
		await assert.rejects(() => cli.execute(Command), 'The "ark-core" process does not exist.');
	});
});
