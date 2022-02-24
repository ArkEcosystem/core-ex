import { Console, describe } from "@arkecosystem/core-test-framework";

import { Identifiers } from "../ioc";
import { Clear } from "./clear";

describe<{
	component: Clear
	cli: Console
}>("Clear", ({beforeEach, it, assert, spy}) => {
	beforeEach((context) => {
		context.cli = new Console();
		context.cli.app.rebind(Identifiers.Clear).to(Clear).inSingletonScope();
		context.component = context.cli.app.get(Identifiers.Clear);
	});

	it("should render the component", async ({component, cli}) => {
		const spyOnWrite = spy(process.stdout, "write")

		component.render();

		spyOnWrite.calledWith("\x1b[2J");
		spyOnWrite.calledWith("\x1b[0f");
	});
});



