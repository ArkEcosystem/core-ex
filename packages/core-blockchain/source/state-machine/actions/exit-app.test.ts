import { Container } from "@arkecosystem/core-container";
import { Identifiers } from "@arkecosystem/core-contracts";
import { describe } from "../../../../core-test-framework";

import { ExitApp } from "./exit-app";

describe<{
	container: Container;
	application;
}>("ExitApp", ({ beforeEach, it, spy }) => {
	beforeEach((context) => {
		context.application = {
			terminate: () => undefined,
		};

		context.container = new Container();
		context.container.bind(Identifiers.Application).toConstantValue(context.application);
	});

	it("should call app.terminate()", (context) => {
		const exitApp = context.container.resolve<ExitApp>(ExitApp);

		const terminateSpy = spy(context.application, "terminate");

		exitApp.handle();

		terminateSpy.calledOnce();
	});
});
