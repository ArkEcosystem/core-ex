import { Console, describe } from "@arkecosystem/core-test-framework";
import prompts from "prompts";

import { Identifiers } from "../ioc";
import { Confirm } from "./confirm";

describe<{
	component: Confirm
	cli: Console
}>("Confirm", ({beforeEach, it, assert, spy}) => {
	beforeEach((context) => {
		context.cli = new Console();
		context.cli.app.rebind(Identifiers.Confirm).to(Confirm).inSingletonScope();
		context.component = context.cli.app.get(Identifiers.Confirm);
	});

	it("should render the component", async ({component, cli}) => {
		prompts.inject([true]);

		assert.true(await component.render("Hello World"))
	});
});

