import { Application, Container } from "@arkecosystem/core-kernel";
import { describe } from "@arkecosystem/core-test";
import { ServiceProvider } from "./service-provider";

describe("ServiceProvider", ({ assert, afterAll, afterEach, beforeAll, beforeEach, it }) => {
	beforeEach((context) => {
		context.app = new Application(new Container.Container());
		context.serviceProvider = context.app.resolve<ServiceProvider>(ServiceProvider);
	});

	it("should register", async (context) => {
		await assert.resolves(() => context.serviceProvider.register());
	});

	it("should be required", async (context) => {
		assert.true(await context.serviceProvider.required());
	});
});
