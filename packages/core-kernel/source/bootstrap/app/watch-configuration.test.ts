import { describe } from "../../../../core-test-framework";

import { Container, Identifiers } from "../../ioc";
import { WatchConfiguration } from "./watch-configuration";
import { Watcher } from "../../services/config/watcher";

describe<{
	app: any;
	watcher: any;
	container: Container;
}>("WatchConfiguration.bootstrap", ({ beforeEach, it, spy, stub }) => {
	beforeEach((context) => {
		context.app = {
			resolve: () => undefined,
		};
		context.watcher = {
			boot: () => undefined,
		};

		context.container = new Container();
		context.container.bind(Identifiers.Application).toConstantValue(context.app);
	});

	it("should boot Watcher", async (context) => {
		const watchConfiguration = context.container.resolve(WatchConfiguration);

		const resolveStub = stub(context.app, "resolve").returnValue(context.watcher);
		const bootSpy = spy(context.watcher, "boot");

		await watchConfiguration.bootstrap();

		resolveStub.calledWith(Watcher);
		bootSpy.calledOnce();
	});
});
