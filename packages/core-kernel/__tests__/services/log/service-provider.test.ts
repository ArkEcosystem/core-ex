import "jest-extended";

import { Application } from "@packages/core-kernel/source/application";
import { Container, Identifiers } from "@packages/core-kernel/source/ioc";
import { ServiceProvider } from "@packages/core-kernel/source/services/log";
import { MemoryLogger } from "@packages/core-kernel/source/services/log/drivers/memory";
import { Logger } from "@packages/core-kernel/source/contracts/kernel/log";

let app: Application;

beforeEach(() => (app = new Application(new Container())));

describe("LogServiceProvider", () => {
	it("should register the service", async () => {
		expect(app.isBound(Identifiers.LogManager)).toBeFalse();
		expect(app.isBound(Identifiers.LogService)).toBeFalse();

		await app.resolve<ServiceProvider>(ServiceProvider).register();

		expect(app.isBound(Identifiers.LogManager)).toBeTrue();
		expect(app.isBound(Identifiers.LogService)).toBeTrue();
	});

	it("should create an instance of the MemoryPipeline", async () => {
		await app.resolve<ServiceProvider>(ServiceProvider).register();

		expect(app.get<Logger>(Identifiers.LogService)).toBeInstanceOf(MemoryLogger);
	});
});
