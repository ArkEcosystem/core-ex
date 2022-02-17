import { describe } from "@arkecosystem/core-test";

import { Container, Utils, Application } from "@arkecosystem/core-kernel";
// import { HttpOptions, HttpResponse } from "@packages/core-kernel/source/utils";
// import * as coditions from "@packages/core-webhooks/source/conditions";
import { Database } from "./database";
// import { WebhookEvent } from "./events";
import { Identifiers } from "./identifiers";
import { Webhook } from "./interfaces";
import { Listener } from "./listener";
import { dirSync, setGracefulCleanup } from "tmp";
import { dummyWebhook } from "../__tests__/__fixtures__/assets";

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
}

describe("Listener.broadcast", ({ beforeEach, afterAll, stub, it }) => {
	beforeEach(() => {
		prepareContainer();
	})

	afterAll(() => {
		setGracefulCleanup();
	})

	it("should broadcast to registered webhooks", async () => {
		// TODO: Implement type checks
		const spyOnPost = stub(Utils.http, "post").resolvedValue({
			statusCode: 200,
		})
		const spyOnDebug = stub(logger, "debug")
		const spyOnDispatch = stub(eventDispatcher, "dispatch");

		database.create(webhook);

		await listener.handle({ name: "event", data: "dummy_data" });

		spyOnPost.calledOnce();
		spyOnDebug.calledOnce();
		spyOnDispatch.calledOnce();

		// TODO: Use called with
		// expect(spyOnDispatch).toHaveBeenCalledWith(
		// 	WebhookEvent.Broadcasted,
		// 	expectFinishedEventData(),
		// );
	})

	it("should log error if broadcast is not successful", async () => {
		const spyOnPost = stub(Utils.http, "post").callsFake(() => {
			throw new Error("dummy error");
		})
		const spyOnError = stub(logger, "error")
		const spyOnDispatch = stub(eventDispatcher, "dispatch");

		database.create(webhook);

		await listener.handle({ name: "event", data: "dummy_data" });

		spyOnPost.calledOnce();
		spyOnError.calledOnce();
		spyOnDispatch.calledOnce();

		// TODO: Use called with
		// expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(WebhookEvent.Failed, expectFailedEventData());
	});
})
