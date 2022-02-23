import { Application, Container, Services } from "@arkecosystem/core-kernel";
import { ServiceProvider } from "./";
import { describe } from "@arkecosystem/core-test-framework";
import { AnySchema } from "joi";
import importFresh from "import-fresh";

let app: Application;

const importDefaults = () =>
 	// @ts-ignore
 	importFresh("../distribution/defaults.js").defaults;

describe("ServiceProvider", ({ beforeEach, it, assert, stub }) => {
	let serviceProvider: ServiceProvider;

	beforeEach(() => {
		app = new Application(new Container.Container());
		app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();

		serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
	});

	it("should register", async () => {
		await assert.resolves(() => serviceProvider.register());
	});

	it("should boot and dispose", async () => {
		stub(app, "get").returnValue({
			initialize: () => {},
			boot: () => {},
			bind: () => {},
		});

		await serviceProvider.register();

		assert.resolves(async () => await serviceProvider.boot());
	});

	it("should boot when the package is core-database", async () => {
		assert.false(await serviceProvider.bootWhen());
		assert.false(await serviceProvider.bootWhen("not-core-database"));
		assert.true(await serviceProvider.bootWhen("@arkecosystem/core-database"));
	});

	describe("ServiceProvider.configSchema", ({ beforeEach }) => {
		beforeEach(() => {
			serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

			for (const key of Object.keys(process.env)) {
				if (key === "CORE_WALLET_SYNC_ENABLED") {
					delete process.env[key];
				}
			}
		});

		it("should validate schema using defaults", () => {
			const defaults = importDefaults();

			const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

			assert.undefined(result.error);

			assert.number(result.value.storage.maxLastBlocks);
			assert.number(result.value.storage.maxLastTransactionIds);

			assert.false(result.value.walletSync.enabled);
		});

		it("should allow configuration extension", () => {
			const defaults = importDefaults();

			// @ts-ignore
			defaults.customField = "dummy";

			const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

			assert.undefined(result.error);
			assert.equal(result.value.customField, "dummy");
		});

		describe("process.env.CORE_WALLET_SYNC_ENABLED", () => {
			it("should return value of process.env.CORE_WALLET_SYNC_ENABLED if defined", () => {
				process.env.CORE_WALLET_SYNC_ENABLED = "true";

				const result = (serviceProvider.configSchema() as AnySchema).validate(importDefaults());

				assert.undefined(result.error);
				assert.true(result.value.walletSync.enabled);
			});
		});

		describe("schema restrictions", () => {
			it("storage is required && is object", () => {
				let defaults = importDefaults();
				defaults.storage = true;

				let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"storage" must be of type object');

				delete defaults.storage;
				result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"storage" is required');
			});

			it("storage.maxLastBlocks is required && is integer && >= 1", () => {
				let defaults = importDefaults();

				defaults.storage.maxLastBlocks = true;
				let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"storage.maxLastBlocks" must be a number');

				defaults.storage.maxLastBlocks = 1.12;
				result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"storage.maxLastBlocks" must be an integer');

				defaults.storage.maxLastBlocks = 0;
				result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"storage.maxLastBlocks" must be greater than or equal to 1');

				delete defaults.storage.maxLastBlocks;
				result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"storage.maxLastBlocks" is required');
			});

			it("storage.maxLastTransactionIds is required && is integer && >= 1", () => {
				let defaults = importDefaults();

				defaults.storage.maxLastTransactionIds = true;
				let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"storage.maxLastTransactionIds" must be a number');

				defaults.storage.maxLastTransactionIds = 1.12;
				result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"storage.maxLastTransactionIds" must be an integer');

				defaults.storage.maxLastTransactionIds = 0;
				result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"storage.maxLastTransactionIds" must be greater than or equal to 1');

				delete defaults.storage.maxLastTransactionIds;
				result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"storage.maxLastTransactionIds" is required');
			});

			it("walletSync is required && is object", () => {
				let defaults = importDefaults();

				defaults.walletSync = true;
				let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"walletSync" must be of type object');

				delete defaults.walletSync;
				result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"walletSync" is required');
			});

			it("walletSync.enabled is required && is boolean", () => {
				let defaults = importDefaults();

				defaults.walletSync.enabled = 123;
				let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"walletSync.enabled" must be a boolean');

				delete defaults.walletSync.enabled;
				result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

				assert.equal(result.error!.message, '"walletSync.enabled" is required');
			});
		});
	});
});
