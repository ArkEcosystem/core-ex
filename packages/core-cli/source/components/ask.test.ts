import { Console, describe } from "@arkecosystem/core-test-framework";
import prompts from "prompts";

import { Identifiers } from "../ioc";
import { Ask } from "./ask";

describe<{
	component: Ask
}>("Ask", ({beforeEach, it, assert}) => {
	beforeEach((context) => {
		const cli = new Console();
		cli.app.rebind(Identifiers.Ask).to(Ask).inSingletonScope();
		context.component = cli.app.get(Identifiers.Ask);
	});

	it("should render the component", async ({component}) => {
		prompts.inject(["john doe"]);

		assert.equal(await component.render("Hello World"), "john doe");
	});
});
