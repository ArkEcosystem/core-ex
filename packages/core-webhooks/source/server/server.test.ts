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


const request = async (server: Server, method, path, payload = {}) => {
	const response = await server.inject({ method, payload, url: `http://localhost:4004/api/${path}` });

	return { body: response.result as any, status: response.statusCode };
};

const createWebhook = (server, data?: any) => request(server, "POST", "webhooks", data || postData);

describe<{
	server: Server
}>("Server", ({ beforeEach, afterEach, afterAll, it, assert }) => {
	beforeEach(async (context) => {
		const logger = {
			debug: () => {},
			error: () => {},
			notice: () => {},
		}

		const app: Application = new Application(new Container.Container());
		app.bind(Container.Identifiers.EventDispatcherService).to(Services.Events.MemoryEventDispatcher).inSingletonScope();
		app.bind(Container.Identifiers.LogService).toConstantValue(logger);
		app.bind("path.cache").toConstantValue(dirSync().name);
		app.bind<Database>(WebhookIdentifiers.Database).to(Database).inSingletonScope();
		app.get<Database>(WebhookIdentifiers.Database).boot();
		app.bind(WebhookIdentifiers.Server).to(Server).inSingletonScope();

		context.server = app.get<Server>(WebhookIdentifiers.Server);

		await context.server.register({
			http: {
				host: "0.0.0.0",
				port: 4004,
			},
		});
		await context.server.boot();
	});

	afterEach(async ({server}) => server.dispose());

	afterAll(() => setGracefulCleanup());

	it("should GET hello world", async ({server}) => {
		const response = await server.inject({ method: "GET", url: `http://localhost:4004/` });

		assert.equal(response.statusCode, 200);
		assert.equal(response.result.data, "Hello World!");
	});

	it("should GET all the webhooks", async ({server}) => {
		await createWebhook(server);
		const response = await request(server, "GET", "webhooks");

		assert.equal(response.status, 200);
		assert.array(response.body.data);
	});

	it("should POST a new webhook with a simple condition", async ({server}) => {
		const response = await createWebhook(server);
		assert.equal(response.status, 201);
		assert.object(response.body.data);
	});

	it("should POST a new webhook with an empty array as condition", async ({server}) => {
		const response = await createWebhook(server, {
			event: Enums.BlockEvent.Forged,
			target: "https://httpbin.org/post",
			enabled: true,
			conditions: [],
		});
		assert.equal(response.status, 201);
		assert.object(response.body.data);
	});

	it("should GET a webhook by the given id", async ({server}) => {
		const { body } = await createWebhook(server);

		const response = await request(server, "GET", `webhooks/${body.data.id}`);
		assert.equal(response.status, 200);
		assert.object(response.body.data);

		body.data.token = undefined;

		assert.equal(response.body.data, body.data);
	});

	it("should fail to GET a webhook by the given id", async ({server}) => {
		assert.equal((await request(server, "GET", `webhooks/123`)).status, 404);
	});

	it("should PUT a webhook by the given id", async ({server}) => {
		const { body } = await createWebhook(server);

		assert.equal((await request(server, "PUT", `webhooks/${body.data.id}`, postData)).status, 204);
	});

	it("should fail to PUT a webhook by the given id", async ({server}) => {
		assert.equal((await request(server, "PUT", `webhooks/123`, postData)).status, 404);
	});

	it("should DELETE a webhook by the given id", async ({server}) => {
		const { body } = await createWebhook(server);

		assert.equal((await request(server, "DELETE", `webhooks/${body.data.id}`)).status, 204);
	});

	it("should fail to DELETE a webhook by the given id", async ({server}) => {
		assert.equal((await request(server, "DELETE", `webhooks/123`)).status, 404);
	});
});
