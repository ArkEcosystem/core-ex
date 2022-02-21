import { Application, Container, Utils } from "@arkecosystem/core-kernel";
import { describe } from "@arkecosystem/core-test-framework";
import { dirSync, setGracefulCleanup } from "tmp";

import { dummyWebhook } from "../__tests__/__fixtures__/assets";
import { Database } from "./database";
import { Identifiers } from "./identifiers";
import { Webhook } from "./interfaces";
import { Listener } from "./listener";
import { WebhookEvent } from "./events";
import * as conditions from "./conditions";

let app: Application;
let database: Database;
let listener: Listener;
let webhook: Webhook;

const logger = {
	debug: () => {},
	error: () => {},
};

const eventDispatcher = {
	dispatch: () => {},
};

const prepareContainer = () => {
	app = new Application(new Container.Container());
	app.bind("path.cache").toConstantValue(dirSync().name);

	app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcher);
	app.bind<Database>(Identifiers.Database).to(Database).inSingletonScope();

	app.bind(Container.Identifiers.LogService).toConstantValue(logger);

	database = app.get<Database>(Identifiers.Database);
	database.boot();

	listener = app.resolve<Listener>(Listener);

	webhook = Object.assign({}, dummyWebhook);
};

const expectFinishedEventData = (assert, {executionTime, webhook, payload}) => {
	assert.number(executionTime);
	assert.object(webhook);
	assert.defined(payload);
}

const expectFailedEventData = (assert, {executionTime, webhook, payload, error}) => {
	assert.number(executionTime);
	assert.object(webhook);
	assert.defined(payload);
	assert.object(error);
};

describe("Listener.broadcast", ({ beforeEach, afterAll, stub, it, assert }) => {
	beforeEach(() => {
		prepareContainer();
	});

	afterAll(() => {
		setGracefulCleanup();
	});

	it("should broadcast to registered webhooks", async () => {
		const spyOnPost = stub(Utils.http, "post").resolvedValue({
			statusCode: 200,
		});
		const spyOnDebug = stub(logger, "debug");
		const spyOnDispatch = stub(eventDispatcher, "dispatch");

		database.create(webhook);

		await listener.handle({ data: "dummy_data", name: "event" });

		spyOnPost.calledOnce();
		spyOnDebug.calledOnce();
		spyOnDispatch.calledOnce();

		const spyOnDispatchArgs = spyOnDispatch.getCallArgs(0)
		assert.equal(spyOnDispatchArgs[0], WebhookEvent.Broadcasted)
		expectFinishedEventData(assert, spyOnDispatchArgs[1])
	});

	it("should log error if broadcast is not successful", async () => {
		const spyOnPost = stub(Utils.http, "post").callsFake(() => {
			throw new Error("dummy error");
		});
		const spyOnError = stub(logger, "error");
		const spyOnDispatch = stub(eventDispatcher, "dispatch");

		database.create(webhook);

		await listener.handle({ data: "dummy_data", name: "event" });

		spyOnPost.calledOnce();
		spyOnError.calledOnce();
		spyOnDispatch.calledOnce();
		const spyOnDispatchArgs = spyOnDispatch.getCallArgs(0);
		assert.equal(spyOnDispatchArgs[0], WebhookEvent.Failed)
		expectFailedEventData(assert, spyOnDispatchArgs[1])
	});
});

describe("Listener.webhooks", ({ beforeEach, afterAll, stub, it, assert }) => {
	beforeEach(() => {
		prepareContainer();
	});

	afterAll(() => {
		setGracefulCleanup();
	});

	it("should not broadcast if webhook is disabled", async () => {
		const spyOnPost = stub(Utils.http, "post");

		webhook.enabled = false;
		database.create(webhook);

		await listener.handle({ name: "event", data: "dummy_data" });

		spyOnPost.neverCalled();
	});

	it("should not broadcast if event is webhook event", async () => {
		const spyOnPost = stub(Utils.http, "post");

		database.create(webhook);

		await listener.handle({ name: WebhookEvent.Broadcasted, data: "dummy_data" });

		spyOnPost.neverCalled();
	});

	it.only("should broadcast if webhook condition is satisfied", async () => {
		const spyOnPost = stub(Utils.http, "post").resolvedValue({
			statusCode: 200,
		});
		const spyOnDispatch = stub(eventDispatcher, "dispatch");

		webhook.conditions = [
			{
				key: "test",
				value: 1,
				condition: "eq",
			},
		];
		database.create(webhook);

		await listener.handle({ name: "event", data: { test: 1 } });

		spyOnPost.calledOnce();
		spyOnDispatch.calledOnce();
		const spyOnDispatchArgs = spyOnDispatch.getCallArgs(0);
		assert.equal(spyOnDispatchArgs[0], WebhookEvent.Broadcasted)
		expectFinishedEventData(assert, spyOnDispatchArgs[1])
	});

	it("should not broadcast if webhook condition is not satisfied", async () => {
		const spyOnPost = stub(Utils.http, "post");

		webhook.conditions = [
			{
				key: "test",
				value: 1,
				condition: "eq",
			},
		];
		database.create(webhook);

		await listener.handle({ name: "event", data: { test: 2 } });

		spyOnPost.neverCalled();
	});

	// it("should not broadcast if webhook condition throws error", async () => {
	// 	const spyOnEq = stub(conditions, "eq").callsFake(() => {
	// 		console.log("STUB THROWS");
	//
	// 		throw new Error("dummy error");
	// 	});
	//
	// 	const spyOnPost = stub(Utils.http, "post");
	//
	// 	webhook.conditions = [
	// 		{
	// 			key: "test",
	// 			value: 1,
	// 			condition: "eq",
	// 		},
	// 	];
	// 	database.create(webhook);
	//
	// 	await listener.handle({ name: "event", data: { test: 2 } });
	//
	// 	spyOnEq.calledOnce();
	// 	spyOnPost.neverCalled();
	// });
});
