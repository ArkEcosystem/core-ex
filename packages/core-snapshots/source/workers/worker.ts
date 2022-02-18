import { Models, Utils } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import { Readable } from "stream";
import { Connection, createConnection, getCustomRepository } from "typeorm";
import { parentPort, workerData } from "worker_threads";

import { JSONCodec, MessagePackCodec, StreamReader, StreamWriter } from "../codecs";
import { Repository, Worker } from "../contracts";
import { Identifiers } from "../ioc";
import { BlockRepository, RoundRepository, TransactionRepository } from "../repositories";
import { DumpWorkerAction, RestoreWorkerAction, TestWorkerAction, VerifyWorkerAction } from "./actions";
import { Application } from "./application";

let app: Application;
let action: Worker.WorkerAction;
const _workerData: Worker.WorkerData = workerData;

/* istanbul ignore next */
const connect = async (options: any): Promise<Connection> =>
	createConnection({
		...options.connection,
		entities: [Models.Block, Models.Transaction, Models.Round],
		namingStrategy: new Utils.SnakeNamingStrategy(),
	});

export const init = async (): Promise<void> => {
	Managers.configManager.setConfig(_workerData.networkConfig);

	app = new Application(new Container.Container());

	/* istanbul ignore next */
	if (_workerData.connection) {
		app.bind(Identifiers.SnapshotDatabaseConnection).toConstantValue(
			await connect({ connection: _workerData.connection }),
		);
	}

	/* istanbul ignore next */
	app.bind(Identifiers.SnapshotRepositoryFactory).toFactory<Repository>(() => (table: string) => {
		if (table === "blocks") {
			return getCustomRepository(BlockRepository);
		}
		if (table === "transactions") {
			return getCustomRepository(TransactionRepository);
		}
		return getCustomRepository(RoundRepository);
	});

	/* istanbul ignore next */
	app.bind<StreamReader>(Identifiers.StreamReaderFactory).toFactory<StreamReader>(
		() => (path: string, useCompression: boolean, decode: Function) =>
			new StreamReader(path, useCompression, decode),
	);

	/* istanbul ignore next */
	app.bind<StreamWriter>(Identifiers.StreamWriterFactory).toFactory<StreamWriter>(
		() => (dbStream: Readable, path: string, useCompression: boolean, encode: Function) =>
			new StreamWriter(dbStream, path, useCompression, encode),
	);

	app.bind(Identifiers.SnapshotCodec)
		.to(MessagePackCodec)
		.inSingletonScope()
		.when(Container.Selectors.anyAncestorOrTargetTaggedFirst("codec", "default"));

	app.bind(Identifiers.SnapshotCodec)
		.to(JSONCodec)
		.inSingletonScope()
		.when(Container.Selectors.anyAncestorOrTargetTaggedFirst("codec", "json"));

	app.bind(Identifiers.SnapshotAction)
		.to(DumpWorkerAction)
		.inSingletonScope()
		.when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "dump"));

	app.bind(Identifiers.SnapshotAction)
		.to(RestoreWorkerAction)
		.inSingletonScope()
		.when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "restore"));

	app.bind(Identifiers.SnapshotAction)
		.to(VerifyWorkerAction)
		.inSingletonScope()
		.when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "verify"));

	// For testing purposes only
	app.bind(Identifiers.SnapshotAction)
		.to(TestWorkerAction)
		.inSingletonScope()
		.when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "test"));

	action = app.getTagged<Worker.WorkerAction>(Identifiers.SnapshotAction, "action", _workerData.actionOptions.action);

	action.init(workerData.actionOptions);
};

export const dispose = async (): Promise<void> => {
	/* istanbul ignore next */
	if (_workerData.connection) {
		const connection = app.get<Connection>(Identifiers.SnapshotDatabaseConnection);

		await connection.close();
	}
};

/* istanbul ignore next */
parentPort?.on("message", async (data: { action: string; data: Worker.WorkerSyncData }) => {
	if (data.action === "start") {
		await init();

		await action.start();

		await dispose();

		process.exit();
	}
	if (data.action === "sync") {
		action.sync(data.data);
	}
});

/* istanbul ignore next */
const handleException = (err: any) => {
	parentPort.postMessage({
		action: "exception",
		data: err,
	});

	process.exit();
};

/* istanbul ignore next */
process.on("unhandledRejection", (err) => {
	handleException(err);
});

/* istanbul ignore next */
process.on("uncaughtException", (err) => {
	handleException(err);
});

/* istanbul ignore next */
process.on("multipleResolves", (err) => {
	handleException(err);
});
