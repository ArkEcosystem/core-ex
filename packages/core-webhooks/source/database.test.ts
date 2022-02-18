import { Application } from "@arkecosystem/core-kernel/source/application";
import { Container } from "@arkecosystem/core-kernel/source/ioc";
import { describe } from "@arkecosystem/core-test-framework";
import { dirSync, setGracefulCleanup } from "tmp";

import { Database } from "./database";
import { Identifiers } from "./identifiers";
import { Webhook } from "./interfaces";

let app: Application;
let database: Database;

const dummyWebhook: Webhook = {
	conditions: [
		{
			condition: "condition",
			key: "key",
			value: "value",
		},
	],
	enabled: true,
	event: "event",
	id: "id",
	target: "target",
	token: "token",
};

describe("Database", ({ beforeEach, afterEach, it, assert }) => {
	beforeEach(() => {
		app = new Application(new Container());
		app.bind("path.cache").toConstantValue(dirSync().name);

		app.bind<Database>(Identifiers.Database).to(Database).inSingletonScope();

		database = app.get<Database>(Identifiers.Database);
		database.boot();
	});

	afterEach(() => {
		setGracefulCleanup();
	});

	it("should boot second time", () => {
		database.boot();
	});

	it("should return all webhooks", () => {
		database.create(dummyWebhook);

		assert.length(database.all(), 1);
	});

	it("should has a webhook by its id", () => {
		const webhook = database.create(dummyWebhook);

		assert.true(database.hasById(webhook.id));
	});

	it("should find a webhook by its id", () => {
		const webhook = database.create(dummyWebhook);

		assert.equal(database.findById(webhook.id), webhook);
	});

	it("should return undefined if webhook not found", () => {
		assert.undefined(database.findById(dummyWebhook.id));
	});

	it("should find webhooks by their event", () => {
		const webhook: Webhook = database.create(dummyWebhook);

		const rows = database.findByEvent("event");

		assert.length(rows, 1);
		assert.equal(rows[0], webhook);
	});

	it("should return an empty array if there are no webhooks for an event", () => {
		assert.length(database.findByEvent("event"), 0);
	});

	it("should create a new webhook", () => {
		const webhook: Webhook = database.create(dummyWebhook);

		assert.equal(database.create(webhook), webhook);
	});

	it("should update an existing webhook", () => {
		const webhook: Webhook = database.create(dummyWebhook);
		const updated: Webhook = database.update(webhook.id, dummyWebhook);

		assert.equal(database.findById(webhook.id), updated);
	});

	it("should delete an existing webhook", () => {
		const webhook: Webhook = database.create(dummyWebhook);

		assert.equal(database.findById(webhook.id), webhook);

		database.destroy(webhook.id);

		assert.undefined(database.findById(webhook.id));
	});
});
