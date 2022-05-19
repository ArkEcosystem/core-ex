import { Identifiers, Constants, Contracts } from "@arkecosystem/core-contracts";
import { ServiceProvider as CoreLmdb } from "@arkecosystem/core-lmdb";
import { describe, Factories, Sandbox } from "@arkecosystem/core-test-framework";
import { dirSync, setGracefulCleanup } from "tmp";

import cryptoJson from "../../core/bin/config/testnet/crypto.json";
import { DatabaseService } from "./database-service";
import { ServiceProvider as CoreDatabase } from "./index";
import lmdb from "lmdb";

describe<{
	sandbox: Sandbox;
	databaseService: DatabaseService;
}>("DatabaseService", ({ beforeAll, beforeEach, it, assert, spy }) => {
	beforeAll(() => {
		setGracefulCleanup();
	});

	beforeEach(async (context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.useDataPath(dirSync().name);

		context.sandbox.app.bind(Identifiers.LogService).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Block.Factory).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Transaction.Factory).toConstantValue({});

		await context.sandbox.app.resolve(CoreLmdb).register();
		await context.sandbox.app.resolve(CoreDatabase).register();

		context.databaseService = context.sandbox.app.get<DatabaseService>(Identifiers.Database.Service);
	});

	it("#saveBlocks - should save a block", async ({ databaseService, sandbox }) => {
		const spyOnBlockStoreagePut = spy(sandbox.app.get<lmdb.Database>(Identifiers.Database.BlockStorage), "put");
		const spyOnBlockHeightStoreagePut = spy(
			sandbox.app.get<lmdb.Database>(Identifiers.Database.BlockHeightStorage),
			"put",
		);
		const spyOnTransactionStoragePut = spy(
			sandbox.app.get<lmdb.Database>(Identifiers.Database.TransactionStorage),
			"put",
		);

		const blockFactory = await Factories.factory("Block", cryptoJson);
		const block = await blockFactory.withOptions({ transactionsCount: 2 }).make<Contracts.Crypto.IBlock>();

		await databaseService.saveBlocks([block]);

		spyOnBlockStoreagePut.calledOnce();
		spyOnBlockHeightStoreagePut.calledOnce();
		spyOnTransactionStoragePut.calledOnce();
	});

	it.only("#saveBlocks - should save a block only once", async ({ databaseService, sandbox }) => {
		const spyOnBlockStoreagePut = spy(sandbox.app.get<lmdb.Database>(Identifiers.Database.BlockStorage), "put");
		const spyOnBlockHeightStoreagePut = spy(
			sandbox.app.get<lmdb.Database>(Identifiers.Database.BlockHeightStorage),
			"put",
		);
		const spyOnTransactionStoragePut = spy(
			sandbox.app.get<lmdb.Database>(Identifiers.Database.TransactionStorage),
			"put",
		);

		const blockFactory = await Factories.factory("Block", cryptoJson);
		const block = await blockFactory.withOptions({ transactionsCount: 2 }).make<Contracts.Crypto.IBlock>();

		await databaseService.saveBlocks([block]);
		await databaseService.saveBlocks([block]);

		// spyOnBlockStoreagePut.calledOnce();
		// spyOnBlockHeightStoreagePut.calledOnce();
		// spyOnTransactionStoragePut.calledOnce();
	});

	it("#saveBlocks - should fail to save block without id", async ({ databaseService }) => {
		await assert.rejects(
			() =>
				databaseService.saveBlocks([
					{
						// @ts-ignore
						data: {
							height: 1,
							id: undefined,
						},
					},
				]),
			"Failed to store block 1 because it has no ID.",
		);
	});
});
