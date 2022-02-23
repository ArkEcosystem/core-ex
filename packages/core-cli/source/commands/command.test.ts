import { Console,describe } from "@arkecosystem/core-test-framework";
import Joi from "joi";

import { injectable } from "../ioc";
import { Command } from "./command";

@injectable()
class StubCommand extends Command {
	public configure(): void {
		this.definition.setArgument("firstName", "description", Joi.string());
		this.definition.setArgument("lastName", "description", Joi.string());

		this.definition.setFlag("token", "description", Joi.string());
		this.definition.setFlag("network", "description", Joi.string().default("testnet"));
		this.definition.setFlag("hello", "description", Joi.string());
	}

	public async execute(): Promise<void> {
		//
	}
}

describe<{
	cmd: Command;
}>("Command", ({ beforeEach, it, assert }) => {
	beforeEach((context) => {
		const cli = new Console();

		context.cmd = cli.app.resolve(StubCommand);
		context.cmd.register(["env:paths", "john", "doe", "--hello=world"]);
	});

	it("should register the command", ({ cmd }) => {
		cmd.register(["env:paths", "john", "doe", "--hello=world"]);
	});
});
