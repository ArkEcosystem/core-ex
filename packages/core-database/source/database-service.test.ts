import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { ServiceProvider as CoreCryptoAddressBeach32m } from "@arkecosystem/core-crypto-address-bech32m";
import { ServiceProvider as CoreCryptoBlock } from "@arkecosystem/core-crypto-block";
import { ServiceProvider as CoreCryptoConfig } from "@arkecosystem/core-crypto-config";
import { ServiceProvider as CoreCryptoHashBcrypto } from "@arkecosystem/core-crypto-hash-bcrypto";
import { ServiceProvider as CoreCryptoKeyPairSchnorr } from "@arkecosystem/core-crypto-key-pair-schnorr";
import { ServiceProvider as CoreCryptoSignatureSchnorr } from "@arkecosystem/core-crypto-signature-schnorr";
import { ServiceProvider as CoreCryptoTransaction } from "@arkecosystem/core-crypto-transaction";
import { ServiceProvider as CoreCryptoTransactionTransfer } from "@arkecosystem/core-crypto-transaction-transfer";
import { ServiceProvider as CoreFees } from "@arkecosystem/core-fees";
import { ServiceProvider as CoreFeesStatic } from "@arkecosystem/core-fees-static";
import { ServiceProvider as CoreLmdb } from "@arkecosystem/core-lmdb";
import { ServiceProvider as CoreSerializer } from "@arkecosystem/core-serializer";
import { ServiceProvider as CoreValidation } from "@arkecosystem/core-validation";
import lmdb from "lmdb";
import { dirSync, setGracefulCleanup } from "tmp";

import cryptoJson from "../../core/bin/config/testnet/crypto.json";
import { describe, Factories, Sandbox } from "../../core-test-framework";
import { DatabaseService } from "./database-service";
import { ServiceProvider as CoreDatabase } from "./index";

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

		await context.sandbox.app.resolve(CoreCryptoConfig).register();
		await context.sandbox.app.resolve(CoreValidation).register();
		await context.sandbox.app.resolve(CoreCryptoKeyPairSchnorr).register();
		await context.sandbox.app.resolve(CoreCryptoSignatureSchnorr).register();
		await context.sandbox.app.resolve(CoreCryptoAddressBeach32m).register();
		await context.sandbox.app.resolve(CoreSerializer).register();
		await context.sandbox.app.resolve(CoreCryptoHashBcrypto).register();
		await context.sandbox.app.resolve(CoreFees).register();
		await context.sandbox.app.resolve(CoreFeesStatic).register();
		await context.sandbox.app.resolve(CoreCryptoTransaction).register();
		await context.sandbox.app.resolve(CoreCryptoTransactionTransfer).register();
		await context.sandbox.app.resolve(CoreCryptoBlock).register();
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
		spyOnTransactionStoragePut.calledTimes(2);

		assert.equal(sandbox.app.get<lmdb.Database>(Identifiers.Database.BlockStorage).getKeysCount(), 1);
		assert.equal(sandbox.app.get<lmdb.Database>(Identifiers.Database.BlockHeightStorage).getKeysCount(), 1);
		assert.equal(sandbox.app.get<lmdb.Database>(Identifiers.Database.TransactionStorage).getKeysCount(), 2);
	});

	it("#saveBlocks - should save a block only once", async ({ databaseService, sandbox }) => {
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

		await databaseService.saveBlocks([block, block]);

		spyOnBlockStoreagePut.calledTimes(1);
		spyOnBlockHeightStoreagePut.calledTimes(1);
		spyOnTransactionStoragePut.calledTimes(2);

		assert.equal(sandbox.app.get<lmdb.Database>(Identifiers.Database.BlockStorage).getKeysCount(), 1);
		assert.equal(sandbox.app.get<lmdb.Database>(Identifiers.Database.BlockHeightStorage).getKeysCount(), 1);
		assert.equal(sandbox.app.get<lmdb.Database>(Identifiers.Database.TransactionStorage).getKeysCount(), 2);
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

	it("getBlock - should return undefined if block doesn't exists", async ({ databaseService }) => {
		assert.undefined(await databaseService.getBlock("undefined"));
	});

	// TODO: With transactions
	it("getBlock - should return block id", async ({ databaseService }) => {
		const blockFactory = await Factories.factory("Block", cryptoJson);
		const block = await blockFactory.make<Contracts.Crypto.IBlock>();

		await databaseService.saveBlocks([block]);

		assert.equal(await databaseService.getBlock(block.data.id), block);
	});
});
