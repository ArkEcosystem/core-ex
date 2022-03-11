import { Container } from "@arkecosystem/core-container";
import { Identifiers } from "@arkecosystem/core-contracts";

import { describe } from "../../../../core-test-framework";
import { Stopped } from "./stopped";

describe<{
	container: Container;
	logger: any;
	application: any;
}>("Stopped", ({ beforeEach, it, spy }) => {
	beforeEach((context) => {
		context.logger = {
			debug: () => {},
			info: () => {},
			warning: () => {},
		};

		context.application = {
			get: () => {},
		};

		context.container = new Container();
		context.container.bind(Identifiers.Application).toConstantValue(context.application);
		context.container.bind(Identifiers.LogService).toConstantValue(context.logger);
	});

	it("should log 'The blockchain has been stopped'", (context) => {
		const stopped = context.container.resolve<Stopped>(Stopped);

		const infoLoggerSpy = spy(context.logger, "info");

		stopped.handle();

		infoLoggerSpy.calledOnce();
		infoLoggerSpy.calledWith("The blockchain has been stopped");
	});
});
