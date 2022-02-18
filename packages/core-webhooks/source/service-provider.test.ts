import { Application, Container, Providers } from "@arkecosystem/core-kernel";
import { NullEventDispatcher } from "@arkecosystem/core-kernel/source/services/events/drivers/null";
import { describe } from "@arkecosystem/core-test-framework";
import importFresh from "import-fresh";
import { AnySchema } from "joi";
import { dirSync, setGracefulCleanup } from "tmp";

import { defaults } from "./defaults";
import { ServiceProvider } from "./service-provider";

let app: Application;
let serviceProvider: ServiceProvider;
let pluginConfiguration: Providers.PluginConfiguration;

const logger = {
	debug: () => {},
	error: () => {},
	notice: () => {},
};

const init = () => {
	app = new Application(new Container.Container());

	app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
	app.bind(Container.Identifiers.StateStore).toConstantValue({});
	app.bind(Container.Identifiers.BlockchainService).toConstantValue({});
	app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue({});
	app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});
	app.bind(Container.Identifiers.WalletRepository).toConstantValue({});
	app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue({});
	app.bind(Container.Identifiers.PeerRepository).toConstantValue({});
	app.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue({});
	app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue({});
	app.bind(Container.Identifiers.TransactionPoolProcessorFactory).toConstantValue({});
	app.bind(Container.Identifiers.TransactionPoolProcessor).toConstantValue({});
	app.bind(Container.Identifiers.BlockHistoryService).toConstantValue({});
	app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue({});
	app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue({});
	app.bind(Container.Identifiers.StandardCriteriaService).toConstantValue({});
	app.bind(Container.Identifiers.PaginationService).toConstantValue({});
	app.bind(Container.Identifiers.EventDispatcherService).to(NullEventDispatcher);
	app.bind(Container.Identifiers.LogService).toConstantValue(logger);
	app.bind("path.cache").toConstantValue(dirSync().name);

	serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
	pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
	const instance = pluginConfiguration.from("core-webhooks", defaults);
	serviceProvider.setConfig(instance);
};

describe("ServiceProvider", ({ beforeEach, afterAll, it, assert }) => {
	beforeEach(() => {
		init();
	});

	afterAll(() => setGracefulCleanup());

	it("should register", async () => {
		await assert.resolves(() => serviceProvider.register());
	});

	it("should boot and dispose", async () => {
		await assert.resolves(() => serviceProvider.register());
		await assert.resolves(() => serviceProvider.boot());
		await assert.resolves(() => serviceProvider.dispose());
	});

	it("should bootWhen be true when enabled", async () => {
		defaults.enabled = true;
		const instance = pluginConfiguration.from("core-webhooks", defaults);
		serviceProvider.setConfig(instance);

		assert.true(await serviceProvider.bootWhen());
	});

	it("should not be required", async () => {
		assert.false(await serviceProvider.required());
	});
});

describe("ServiceProvider.configSchema", ({ beforeEach, assert, it }) => {
	const importDefaults = () => importFresh("../distribution/defaults.js").defaults;

	let defaults;

	beforeEach(() => {
		init();

		for (const key of Object.keys(process.env)) {
			if (key.includes("CORE_WEBHOOKS_")) {
				delete process.env[key];
			}
		}

		defaults = importDefaults();
	});

	it("should validate schema using defaults", async () => {
		const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.undefined(result.error);
		assert.false(result.value.enabled);
		assert.string(result.value.server.http.host);
		assert.number(result.value.server.http.port);
		assert.array(result.value.server.whitelist);
		for (const item of result.value.server.whitelist) {
			assert.string(item);
		}
		assert.number(result.value.timeout);
	});

	it("should allow configuration extension", async () => {
		defaults["customField"] = "dummy";

		const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.undefined(result.error);
		assert.equal(result.value.customField, "dummy");
	});

	it("should return true if process.env.CORE_WEBHOOKS_ENABLED is defined", async () => {
		process.env.CORE_WEBHOOKS_ENABLED = "true";

		const result = (serviceProvider.configSchema() as AnySchema).validate(importDefaults());

		assert.undefined(result.error);
		assert.true(result.value.enabled);
	});

	it("should return value of process.env.CORE_WEBHOOKS_HOST if defined", async () => {
		process.env.CORE_WEBHOOKS_HOST = "127.0.0.1";

		const result = (serviceProvider.configSchema() as AnySchema).validate(importDefaults());

		assert.undefined(result.error);
		assert.equal(result.value.server.http.host, "127.0.0.1");
	});

	it("should return value of process.env.CORE_WEBHOOKS_TIMEOUT if defined", async () => {
		process.env.CORE_WEBHOOKS_TIMEOUT = "5000";

		const result = (serviceProvider.configSchema() as AnySchema).validate(importDefaults());

		assert.undefined(result.error);
		assert.equal(result.value.timeout, 5000);
	});

	it("enabled is required && is boolean", async () => {
		defaults.enabled = 123;
		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"enabled" must be a boolean');

		delete defaults.enabled;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"enabled" is required');
	});

	it("server is required && is object", async () => {
		defaults.server = false;
		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server" must be of type object');

		delete defaults.server;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server" is required');
	});

	it("server.http is required && is object", async () => {
		defaults.server.http = false;
		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.http" must be of type object');

		delete defaults.server.http;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.http" is required');
	});

	it("server.http.host is required && is IP address", async () => {
		defaults.server.http.host = false;
		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.http.host" must be a string');

		defaults.server.http.host = "dummy";
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(
			result.error.message,
			'"server.http.host" must be a valid ip address of one of the following versions [ipv4, ipv6] with a optional CIDR',
		);

		delete defaults.server.http.host;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.http.host" is required');
	});

	it("server.http.port is required && is integer && >= 1 && <= 65535", async () => {
		defaults.server.http.port = false;
		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.http.port" must be a number');

		defaults.server.http.port = 1.12;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.http.port" must be an integer');

		defaults.server.http.port = 0;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.http.port" must be greater than or equal to 1');

		defaults.server.http.port = 65_536;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.http.port" must be less than or equal to 65535');

		delete defaults.server.http.port;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.http.port" is required');
	});

	it("server.whitelist is required && is array && contains strings", async () => {
		defaults.server.whitelist = false;
		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.whitelist" must be an array');

		defaults.server.whitelist = [false];
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.whitelist[0]" must be a string');

		delete defaults.server.whitelist;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"server.whitelist" is required');
	});

	it("timeout is required && is integer && >= 1", async () => {
		defaults.timeout = false;
		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"timeout" must be a number');

		defaults.timeout = 1.1;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"timeout" must be an integer');

		defaults.timeout = 0;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"timeout" must be greater than or equal to 1');

		delete defaults.timeout;
		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

		assert.equal(result.error.message, '"timeout" is required');
	});
});
