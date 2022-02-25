import { Console, describe } from "@arkecosystem/core-test-framework";

import { Identifiers } from "../ioc";
import { Toggle } from "./toggle";

describe<{
	component: Toggle;
	cli: Console;
}>("Log", ({ beforeEach, it, assert, spy }) => {
	beforeEach((context) => {
		context.cli = new Console();
		context.cli.app.rebind(Identifiers.Toggle).to(Toggle).inSingletonScope();
		context.component = context.cli.app.get(Identifiers.Toggle);
	});

	// TODO: Check later
	// it("should render the component", async ({component, cli}) => {
	// 	const spyOnLog = spy(cli.app.get(Identifiers.Logger), "log")

	// 	assert.equal(await component.render("Hello World"), "yes");
	// });
});
