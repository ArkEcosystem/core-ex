import { Application, Container, Services } from "@arkecosystem/core-kernel";
import { describe } from "@arkecosystem/core-test-framework";
import { dirSync, setGracefulCleanup } from "tmp";

import { Database } from "../../database";
import { Identifiers as WebhookIdentifiers } from "../../identifiers";
import { Server } from "../server";

const initApp = (): Application => {
	const app: Application = new Application(new Container.Container());

	app.bind(Container.Identifiers.EventDispatcherService).to(Services.Events.MemoryEventDispatcher).inSingletonScope();

	app.bind(Container.Identifiers.LogService).toConstantValue({
		debug: () => {},
		error: () => {},
		notice: () => {},
	});

	app.bind("path.cache").toConstantValue(dirSync().name);
	app.bind<Database>(WebhookIdentifiers.Database).to(Database).inSingletonScope();
	app.get<Database>(WebhookIdentifiers.Database).boot();
	// Setup Server...
	app.bind(WebhookIdentifiers.Server).to(Server).inSingletonScope();

	return app;
};

const initServer = async (app: Application, serverOptions: any): Promise<Server> => {
	const server = app.get<Server>(WebhookIdentifiers.Server);

	await server.register(serverOptions);
	await server.boot();

	return server;
};

const request = async (server: Server, method, path, payload = {}) => {
	const response = await server.inject({ method, payload, url: `http://localhost:4004/api/${path}` });

	return { body: response.result as any, status: response.statusCode };
};

describe("Whitelist", ({ beforeEach, afterEach, afterAll, it, assert }) => {
	let server: Server;
	let app: Application;
	const serverOptions = {
		host: "0.0.0.0",
		port: 4004,
		whitelist: ["127.0.0.1"],
	};

	beforeEach(() => {
		app = initApp();
	});

	afterEach(async () => server.dispose());

	afterAll(() => setGracefulCleanup());

	it("should GET all the webhooks if whitelisted", async () => {
		server = await initServer(app, serverOptions);

		const response = await request(server, "GET", "webhooks");

		assert.equal(response.status, 200);
		assert.array(response.body.data);
	});

	it("should GET error if not whitelisted", async () => {
		serverOptions.whitelist = ["128.0.0.1"];
		server = await initServer(app, serverOptions);

		const response = await request(server, "GET", "webhooks");

		assert.equal(response.status, 403);
	});
});
