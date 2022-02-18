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

describe("Listener.broadcast", ({ beforeEach, afterAll, stub, it }) => {
	beforeEach(() => {
		prepareContainer();
	});

	afterAll(() => {
		setGracefulCleanup();
	});

	it("should broadcast to registered webhooks", async () => {
		// TODO: Implement type checks
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

		// TODO: Use called with
		// expect(spyOnDispatch).toHaveBeenCalledWith(
		// 	WebhookEvent.Broadcasted,
		// 	expectFinishedEventData(),
		// );
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

		// TODO: Use called with
		// expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(WebhookEvent.Failed, expectFailedEventData());
	});
});

describe("Listener.webhooks", ({ beforeEach, afterAll, stub, it }) => {
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

	it("should broadcast if webhook condition is satisfied", async () => {
		const spyOnPost = stub(Utils.http, "post");
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

		// TODO: Use called with
		// expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
		// 	WebhookEvent.Broadcasted,
		// 	expectFinishedEventData(),
		// );
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
