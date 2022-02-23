import { describe } from "../../core-test-framework";
import { defaults } from "./defaults";
import { ServiceProvider } from "./service-provider";
import { Application, Container, Providers } from "@arkecosystem/core-kernel";
// import { AnySchema } from "joi";
import typeorm from "typeorm";

// jest.mock("typeorm", () =>
// 	Object.assign(jest.requireActual("typeorm"), {
// 		createConnection: spyFn,
// 		getCustomRepository: spyFn,
// 	}),
// );

describe<{
	app: Application;
	logger: any;
	events: any;
}>("ServiceProvider", ({ assert, beforeEach, it, spy, spyFn, stub }) => {
	beforeEach((context) => {
		context.logger = {
			debug: spyFn(),
			info: spyFn(),
		};

		context.events = {
			dispatch: spyFn(),
		};

		context.app = new Application(new Container.Container());
		context.app.bind(Container.Identifiers.LogService).toConstantValue(context.logger);
		context.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(context.events);
	});

	it.only("register should connect to database, bind triggers, and bind services", async (context) => {
		// const typeorm = await import("typeorm");
		const mockCreateConnection = spy(typeorm, "createConnection");
		const mockGetCustomRepository = spy(typeorm, "getCustomRepository");
		// try {
		// 	// // @ts-ignore
		// 	// typeorm.createConnection = spy();
		// 	// // @ts-ignore
		// 	// typeorm.getCustomRepository = spy();
		// } catch (e) {
		// 	console.log(e);
		// 	throw e;
		// }

		const serviceProvider = context.app.resolve(ServiceProvider);
		const pluginConfiguration = context.app
			.resolve(Providers.PluginConfiguration)
			.from("core-database", { ...defaults });
		serviceProvider.setConfig(pluginConfiguration);

		try {
			await serviceProvider.register();
		} catch (e) {
			console.log(e);
			throw e;
		}

		assert.true(mockCreateConnection.calledWith());
		assert.true(mockGetCustomRepository.calledTimes(3));

		// assert.true(context.events.dispatch).toBeCalled();

		assert.is(context.app.isBound(Container.Identifiers.DatabaseConnection), true);
		assert.is(context.app.isBound(Container.Identifiers.DatabaseRoundRepository), true);
		assert.is(context.app.isBound(Container.Identifiers.DatabaseBlockRepository), true);
		assert.is(context.app.isBound(Container.Identifiers.DatabaseBlockFilter), true);
		assert.is(context.app.isBound(Container.Identifiers.BlockHistoryService), true);
		assert.is(context.app.isBound(Container.Identifiers.DatabaseTransactionRepository), true);
		assert.is(context.app.isBound(Container.Identifiers.DatabaseTransactionFilter), true);
		assert.is(context.app.isBound(Container.Identifiers.TransactionHistoryService), true);
		assert.is(context.app.isBound(Container.Identifiers.DatabaseModelConverter), true);
		assert.is(context.app.isBound(Container.Identifiers.DatabaseService), true);
	});

	it("boot should call DatabaseService.initialize method", async (context) => {
		const serviceProvider = context.app.resolve(ServiceProvider);

		const databaseService = { initialize: spyFn() };
		context.app.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);

		await serviceProvider.boot();

		assert.true(databaseService.initialize.calledWith());
	});

	it("dispose should call DatabaseService.disconnect method", async (context) => {
		const serviceProvider = context.app.resolve(ServiceProvider);

		const databaseService = { disconnect: spyFn() };
		context.app.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);

		await serviceProvider.dispose();

		assert.true(databaseService.disconnect.calledWith());
	});

	it("required should return true", async (context) => {
		const serviceProvider = context.app.resolve(ServiceProvider);

		const result = await serviceProvider.required();

		assert.is(result, true);
	});
});

// describe<{
// 	app: Application;
// }>("ServiceProvider.configSchema", ({ assert, beforeEach, it }) => {
// 	let serviceProvider: ServiceProvider;
//
// 	beforeEach((context) => {
// 		serviceProvider = context.app.resolve<ServiceProvider>(ServiceProvider);
//
// 		for (const key of Object.keys(process.env)) {
// 			if (key.includes("CORE_DB_")) {
// 				delete process.env[key];
// 			}
// 		}
//
// 		process.env.CORE_TOKEN = "ark";
// 		process.env.CORE_NETWORK_NAME = "testnet";
// 	});
//
// 	it.only("should validate schema using defaults", async () => {
// 		const result = (serviceProvider.configSchema() as AnySchema).validate((await import("./defaults")).defaults);
//
// 		assert.undefined(result.error);
//
// 		assert.equal(result.value.connection.type, "postgres");
// 		assert.equal(result.value.connection.host, "localhost");
// 		assert.equal(result.value.connection.port, 5432);
// 		assert.equal(result.value.connection.database, "ark_testnet");
// 		assert.equal(result.value.connection.username, "ark");
// 		assert.instance(result.value.connection.password, String);
// 		assert.instance(result.value.connection.entityPrefix, String);
// 		assert.false(result.value.connection.synchronize);
// 		assert.false(result.value.connection.logging);
// 	});
//
// 	it("should allow configuration extension", async () => {
// 		const defaults = (await import("./defaults")).defaults;
//
// 		// @ts-ignore
// 		defaults.customField = "dummy";
//
// 		const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
//
// 		assert.undefined(result.error);
// 		assert.equal(result.value.customField, "dummy");
// 	});
//
// 	it("should return value of process.env.CORE_DB_HOST if defined", async () => {
// 		process.env.CORE_DB_HOST = "custom_hostname";
//
// 		jest.resetModules();
// 		const result = (serviceProvider.configSchema() as AnySchema).validate((await import("./defaults")).defaults);
//
// 		assert.undefined(result.error);
// 		assert.equal(result.value.connection.host, "custom_hostname");
// 	});
//
// 	it("should return value of process.env.CORE_DB_PORT if defined", async () => {
// 		process.env.CORE_DB_PORT = "123";
//
// 		jest.resetModules();
// 		const result = (serviceProvider.configSchema() as AnySchema).validate((await import("./defaults")).defaults);
//
// 		assert.undefined(result.error);
// 		assert.equal(result.value.connection.port, 123);
// 	});
//
// 	it("should return value of process.env.CORE_DB_DATABASE if defined", async () => {
// 		process.env.CORE_DB_DATABASE = "custom_database";
//
// 		jest.resetModules();
// 		const result = (serviceProvider.configSchema() as AnySchema).validate((await import("./defaults")).defaults);
//
// 		assert.undefined(result.error);
// 		assert.equal(result.value.connection.database, "custom_database");
// 	});
//
// 	it("should return value of process.env.CORE_DB_USERNAME if defined", async () => {
// 		process.env.CORE_DB_USERNAME = "custom_username";
//
// 		jest.resetModules();
// 		const result = (serviceProvider.configSchema() as AnySchema).validate((await import("./defaults")).defaults);
//
// 		assert.undefined(result.error);
// 		assert.equal(result.value.connection.username, "custom_username");
// 	});
//
// 	it("should return value of process.env.CORE_DB_PASSWORD if defined", async () => {
// 		process.env.CORE_DB_PASSWORD = "custom_password";
//
// 		jest.resetModules();
// 		const result = (serviceProvider.configSchema() as AnySchema).validate((await import("./defaults")).defaults);
//
// 		assert.undefined(result.error);
// 		assert.equal(result.value.connection.password, "custom_password");
// 	});
//
// 	// describe("schema restrictions", () => {
// 	// 	let defaults;
// 	//
// 	// 	// beforeEach(async () => {
// 	// 	// 	jest.resetModules();
// 	// 	// 	defaults = (await import("./defaults")).defaults;
// 	// 	// });
// 	//
// 	// 	it("connection is required", async () => {
// 	// 		delete defaults.connection;
// 	// 		const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection" is required');
// 	// 	});
// 	//
// 	// 	it("connection.type is required && is string", async () => {
// 	// 		defaults.connection.type = false;
// 	// 		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.type" must be a string');
// 	//
// 	// 		delete defaults.connection.type;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.type" is required');
// 	// 	});
// 	//
// 	// 	it("connection.host is required && is string", async () => {
// 	// 		defaults.connection.host = false;
// 	// 		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.host" must be a string');
// 	//
// 	// 		delete defaults.connection.host;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.host" is required');
// 	// 	});
// 	//
// 	// 	it("connection.port is required && is integer && is >= 1 and <= 65535", async () => {
// 	// 		defaults.connection.port = false;
// 	// 		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.port" must be a number');
// 	//
// 	// 		defaults.connection.port = 1.12;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.port" must be an integer');
// 	//
// 	// 		defaults.connection.port = 0;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.port" must be greater than or equal to 1');
// 	//
// 	// 		defaults.connection.port = 65536;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.port" must be less than or equal to 65535');
// 	//
// 	// 		delete defaults.connection.port;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.port" is required');
// 	// 	});
// 	//
// 	// 	it("connection.database is required && is string", async () => {
// 	// 		defaults.connection.database = false;
// 	// 		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.database" must be a string');
// 	//
// 	// 		delete defaults.connection.database;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.database" is required');
// 	// 	});
// 	//
// 	// 	it("connection.username is required && is string", async () => {
// 	// 		defaults.connection.username = false;
// 	// 		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.username" must be a string');
// 	//
// 	// 		delete defaults.connection.username;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.username" is required');
// 	// 	});
// 	//
// 	// 	it("connection.password is required && is string", async () => {
// 	// 		defaults.connection.password = false;
// 	// 		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.password" must be a string');
// 	//
// 	// 		delete defaults.connection.password;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.password" is required');
// 	// 	});
// 	//
// 	// 	it("connection.entityPrefix is required && is string", async () => {
// 	// 		defaults.connection.entityPrefix = false;
// 	// 		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.entityPrefix" must be a string');
// 	//
// 	// 		delete defaults.connection.entityPrefix;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.entityPrefix" is required');
// 	// 	});
// 	//
// 	// 	it("connection.synchronize is required && is boolean", async () => {
// 	// 		defaults.connection.synchronize = 123;
// 	// 		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.synchronize" must be a boolean');
// 	//
// 	// 		delete defaults.connection.synchronize;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.synchronize" is required');
// 	// 	});
// 	//
// 	// 	it("connection.logging is required && is boolean", async () => {
// 	// 		defaults.connection.logging = 123;
// 	// 		let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.logging" must be a boolean');
// 	//
// 	// 		delete defaults.connection.logging;
// 	// 		result = (serviceProvider.configSchema() as AnySchema).validate(defaults);
// 	//
// 	// 		assert.equal(result.error!.message, '"connection.logging" is required');
// 	// 	});
// 	// });
// });
