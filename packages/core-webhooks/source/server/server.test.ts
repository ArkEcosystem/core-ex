import { Application, Container, Enums, Services } from "@arkecosystem/core-kernel";
import { describe } from "@arkecosystem/core-test-framework";
import { dirSync, setGracefulCleanup } from "tmp";

import { Database } from "../database";
import { Identifiers as WebhookIdentifiers } from "../identifiers";
import { Server } from "./server";

const postData = {
	conditions: [
		{
			condition: "eq",
			key: "generatorPublicKey",
			value: "test-generator",
		},
		{
			condition: "gte",
			key: "fee",
			value: "123",
		},
	],
	enabled: true,
	event: Enums.BlockEvent.Forged,
	target: "https://httpbin.org/post",
};
let server: Server;
const serverOptions = {
	http: {
		host: "0.0.0.0",
		port: 4004,
	},
};

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

const createWebhook = (server, data?: any) => request(server, "POST", "webhooks", data || postData);

describe("Server", ({ beforeEach, afterEach, afterAll, it, assert }) => {
	beforeEach(async () => {
		const app: Application = initApp();

		server = await initServer(app, serverOptions);
	});

	afterEach(async () => server.dispose());

	afterAll(() => setGracefulCleanup());

	it("should GET hello world", async () => {
		const response = await server.inject({ method: "GET", url: `http://localhost:4004/` });

		assert.equal(response.statusCode, 200);
		assert.equal(response.result.data, "Hello World!");
	});

	it("should GET all the webhooks", async () => {
		await createWebhook(server);
		const response = await request(server, "GET", "webhooks");

		assert.equal(response.status, 200);
		assert.array(response.body.data);
	});

	it("should POST a new webhook with a simple condition", async () => {
		const response = await createWebhook(server);
		assert.equal(response.status, 201);
		assert.object(response.body.data);
	});

	it("should POST a new webhook with an empty array as condition", async () => {
		const response = await createWebhook(server, {
			event: Enums.BlockEvent.Forged,
			target: "https://httpbin.org/post",
			enabled: true,
			conditions: [],
		});
		assert.equal(response.status, 201);
		assert.object(response.body.data);
	});

	it("should GET a webhook by the given id", async () => {
		const { body } = await createWebhook(server);

		const response = await request(server, "GET", `webhooks/${body.data.id}`);
		assert.equal(response.status, 200);
		assert.object(response.body.data);

		body.data.token = undefined;

		assert.equal(response.body.data, body.data);
	});

	it("should fail to GET a webhook by the given id", async () => {
		assert.equal((await request(server, "GET", `webhooks/123`)).status, 404);
	});

	it("should PUT a webhook by the given id", async () => {
		const { body } = await createWebhook(server);

		assert.equal((await request(server, "PUT", `webhooks/${body.data.id}`, postData)).status, 204);
	});

	it("should fail to PUT a webhook by the given id", async () => {
		assert.equal((await request(server, "PUT", `webhooks/123`, postData)).status, 404);
	});

	it("should DELETE a webhook by the given id", async () => {
		const { body } = await createWebhook(server);

		assert.equal((await request(server, "DELETE", `webhooks/${body.data.id}`)).status, 204);
	});

	it("should fail to DELETE a webhook by the given id", async () => {
		assert.equal((await request(server, "DELETE", `webhooks/123`)).status, 404);
	});
});
