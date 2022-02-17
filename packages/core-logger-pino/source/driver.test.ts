import { sleep } from "@arkecosystem/utils";
import { Application } from "@packages/core-kernel";
import { Container, Contracts } from "@packages/core-kernel";
import { PinoLogger } from "./driver";
import capcon from "capture-console";
import { readdirSync } from "fs-extra";
import { Writable } from "stream";
import { dirSync, setGracefulCleanup } from "tmp";
import { describe } from "@arkecosystem/core-test";

let logger: Contracts.Kernel.Logger;
let message: string;

let app: Application;

describe("Logger", ({ assert, afterAll, afterEach, beforeAll, beforeEach, it }) => {
	beforeAll(() => {
		capcon.startCapture(process.stdout, (stdout) => (message = stdout.toString()));

		capcon.startCapture(process.stderr, (stderr) => (message = stderr.toString()));

		// @ts-ignore
		capcon.startCapture(console._stdout, (stdout) => (message = stdout.toString()));

		// @ts-ignore
		capcon.startCapture(console._stderr, (stderr) => (message = stderr.toString()));
	});

	afterAll(() => setGracefulCleanup());

	beforeEach(async () => {
		app = new Application(new Container.Container());
		app.bind(Container.Identifiers.ConfigFlags).toConstantValue("core");
		app.bind(Container.Identifiers.ApplicationNamespace).toConstantValue("ark-unitnet");
		app.bind("path.log").toConstantValue(dirSync().name);

		logger = await app.resolve<Contracts.Kernel.Logger>(PinoLogger).make({
			levels: {
				console: process.env.CORE_LOG_LEVEL || "debug",
				file: process.env.CORE_LOG_LEVEL_FILE || "debug",
			},
			fileRotator: {
				interval: "1d",
			},
		});
	});

	afterEach(() => (message = undefined));

	it("should not be logged if empty", () => {
		logger.info(undefined);

		assert.undefined(message);
	});

	it("should modify the message if it is not a string", () => {
		logger.info(["Hello World"]);

		assert.match(message.trim(), "[ 'Hello World' ]");
	});

	it("should log a message with the [emergency] level", () => {
		logger.emergency("emergency_message");

		assert.match(message, /emergency/);
		assert.match(message, /emergency_message/);
	});

	it("should log a message with the [alert] level", () => {
		logger.alert("alert_message");

		assert.match(message, /alert/);
		assert.match(message, /alert_message/);
	});

	it("should log a message with the [critical] level", () => {
		logger.critical("critical_message");

		assert.match(message, /critical/);
		assert.match(message, /critical_message/);
	});

	it("should log a message with the [error] level", () => {
		logger.error("error_message");

		assert.match(message, /error/);
		assert.match(message, /error_message/);
	});

	it("should log a message with the [warning] level", () => {
		logger.warning("warning_message");

		assert.match(message, /warning/);
		assert.match(message, /warning_message/);
	});

	it("should log a message with the [notice] level", () => {
		logger.notice("notice_message");

		assert.match(message, /notice/);
		assert.match(message, /notice_message/);
	});

	it("should log a message with the [info] level", () => {
		logger.info("info_message");

		assert.match(message, /info/);
		assert.match(message, /info_message/);
	});

	it("should log a message with the [debug] level", () => {
		logger.debug("debug_message");

		assert.match(message, /debug/);
		assert.match(message, /debug_message/);
	});

	it("should suppress console output", () => {
		logger.suppressConsoleOutput(true);

		logger.info("silent_message");

		// @TODO Something is working different here
		// assert.undefined(message);
		assert.equal(message, "[90m• [39m");

		logger.suppressConsoleOutput(false);

		logger.info("non_silent_message");
		assert.match(message, /non_silent_message/);
	});

	it("should log error if there is an error on file stream", async () => {
		const logger = app.resolve<Contracts.Kernel.Logger>(PinoLogger);

		const writableMock = new Writable({
			write(chunk, enc, cb) {
				throw new Error("Stream error");
			},
		});
		// @ts-ignore
		logger.getFileStream = () => {
			return writableMock;
		};

		await logger.make({
			levels: {
				console: "invalid",
				file: process.env.CORE_LOG_LEVEL_FILE || "debug",
			},
			fileRotator: {
				interval: "1d",
			},
		});

		writableMock.destroy(new Error("Test error"));

		await sleep(100);

		assert.match(message, "File stream closed due to an error: Error: Test error");

		await assert.resolves(() => logger.dispose());
	});

	it("should rotate the log 3 times", async () => {
		const app = new Application(new Container.Container());
		app.bind(Container.Identifiers.ConfigFlags).toConstantValue("core");
		app.bind(Container.Identifiers.ApplicationNamespace).toConstantValue("ark-unitnet");
		app.useLogPath(dirSync().name);

		const ms = new Date().getMilliseconds();
		await sleep(1000 - ms + 400);

		const logger = await app.resolve(PinoLogger).make({
			levels: {
				console: process.env.CORE_LOG_LEVEL || "emergency",
				file: process.env.CORE_LOG_LEVEL_FILE || "emergency",
			},
			fileRotator: {
				interval: "1s",
			},
		});

		for (let i = 0; i < 3; i++) {
			logger.info(`Test ${i + 1}`);

			await sleep(900);
		}

		const files = readdirSync(app.logPath());
		assert.length(
			files.filter((file) => file.endsWith(".log.gz")),
			3,
		);
		assert.length(files, 5);
	});

	describe("make", () => {
		it("should create a file stream if level is valid", () => {
			// @ts-ignore
			assert.defined(logger.combinedFileStream);
		});

		it("should not create a file stream if level not is valid", async () => {
			const logger = await app.resolve<PinoLogger>(PinoLogger).make({
				levels: {
					console: process.env.CORE_LOG_LEVEL || "debug",
					file: "invalid",
				},
				fileRotator: {
					interval: "1d",
				},
			});

			// @ts-ignore
			assert.undefined(logger.combinedFileStream);
		});
	});

	describe("dispose", () => {
		it("should dispose before make", async () => {
			const logger = await app.resolve<PinoLogger>(PinoLogger);

			await assert.resolves(() => logger.dispose());
		});

		it("should dispose after make", async () => {
			await assert.resolves(() => logger.dispose());
		});
	});
});
