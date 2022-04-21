import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import clone from "lodash.clone";

import crypto from "../../core/bin/config/testnet/crypto.json";
import { ServiceProvider as CoreCryptoAddressBech32m } from "../../core-crypto-address-bech32m";
import { ServiceProvider as CoreCryptoConfig } from "../../core-crypto-config";
import { Configuration } from "../../core-crypto-config/source/configuration";
import { ServiceProvider as CoreCryptoHashBcrypto } from "../../core-crypto-hash-bcrypto";
import { ServiceProvider as CoreCryptoKeyPairSchnorr } from "../../core-crypto-key-pair-schnorr";
import { ServiceProvider as CoreCryptoSignatureSchnorr } from "../../core-crypto-signature-schnorr";
import { ServiceProvider as CoreCryptoTime } from "../../core-crypto-time";
import { ServiceProvider as CoreCryptoTransaction } from "../../core-crypto-transaction";
import { ServiceProvider as CoreCryptoTransactionTransfer } from "../../core-crypto-transaction-transfer";
import { ServiceProvider as CoreCryptoValidation } from "../../core-crypto-validation";
import { ServiceProvider as CoreCryptoWif } from "../../core-crypto-wif";
import { ServiceProvider as CoreFees } from "../../core-fees";
import { ServiceProvider as CoreFeesStatic } from "../../core-fees-static";
import { ServiceProvider as CoreSerializer } from "../../core-serializer";
import { describe, Factories, Sandbox } from "../../core-test-framework";
import { ServiceProvider as CoreValidation } from "../../core-validation";
import {
	blockData,
	blockDataJson,
	blockDataWithTransactions,
	blockDataWithTransactionsJson,
	serialized,
	serializedWithTransactions,
} from "../test/fixtures/block";
import { assertBlockData, assertTransactionData } from "../test/helpers/asserts";
import { Deserializer } from "./deserializer";
import { BlockFactory } from "./factory";
import { IDFactory } from "./id.factory";
import { Serializer } from "./serializer";
interface Identity {
	keys: Contracts.Crypto.IKeyPair;
	publicKey: string;
	privateKey: string;
	address: string;
	wif: string;
	passphrase: string;
	secondPassphrase?: string;
}

describe<{
	expectBlock: ({ data }: { data: Contracts.Crypto.IBlockData }) => void;
	sandbox: Sandbox;
	factory: BlockFactory;
	serializer: Serializer;
}>("BlockFactory", ({ it, assert, beforeEach }) => {
	const blockDataOriginal = clone(blockData);
	// Recalculated id
	const blockDataWithTransactionsOriginal = clone(blockDataWithTransactions);
	let blockDataClone;
	let blockDataWithTransactionsClone;

	beforeEach(async (context) => {
		blockDataClone = clone(blockDataOriginal);
		blockDataWithTransactionsClone = clone(blockDataWithTransactionsOriginal);

		context.sandbox = new Sandbox();

		await context.sandbox.app.resolve(CoreSerializer).register();
		await context.sandbox.app.resolve(CoreValidation).register();
		await context.sandbox.app.resolve(CoreCryptoConfig).register();
		await context.sandbox.app.resolve(CoreCryptoTime).register();
		await context.sandbox.app.resolve(CoreCryptoValidation).register();
		await context.sandbox.app.resolve(CoreCryptoHashBcrypto).register();
		await context.sandbox.app.resolve(CoreCryptoSignatureSchnorr).register();
		await context.sandbox.app.resolve(CoreCryptoKeyPairSchnorr).register();
		await context.sandbox.app.resolve(CoreCryptoAddressBech32m).register();
		await context.sandbox.app.resolve(CoreCryptoWif).register();
		await context.sandbox.app.resolve(CoreFees).register();
		await context.sandbox.app.resolve(CoreFeesStatic).register();
		await context.sandbox.app.resolve(CoreCryptoTransaction).register();
		await context.sandbox.app.resolve(CoreCryptoTransactionTransfer).register();
		context.sandbox.app.bind(Identifiers.Cryptography.Block.Serializer).to(Serializer);
		context.sandbox.app.bind(Identifiers.Cryptography.Block.Deserializer).to(Deserializer);
		context.sandbox.app.bind(Identifiers.Cryptography.Block.IDFactory).to(IDFactory);

		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(crypto);

		context.factory = context.sandbox.app.resolve(BlockFactory);
		context.serializer = context.sandbox.app.resolve(Serializer);
	});

	it("#make - should make a block", async ({ factory, sandbox }) => {
		// @ts-ignore
		const identityFactory = await Factories.factory("Identity", crypto);
		const identity = await identityFactory.withOptions({ passphrase: "passphrase" }).make<Identity>();

		const block = await factory.make(blockData, identity.keys);

		assertBlockData(assert, block.data, blockData);
		assertBlockData(assert, block.header, blockData);
		assert.equal(block.transactions, []);
		assert.string(block.serialized);
	});

	it("#make - should make a block with transactions", async ({ factory }) => {
		// @ts-ignore
		const identityFactory = await Factories.factory("Identity", crypto);
		const identity = await identityFactory.withOptions({ passphrase: "passphrase" }).make<Identity>();

		const block = await factory.make(blockDataWithTransactions, identity.keys);

		assertBlockData(assert, block.data, blockDataWithTransactions);
		assertBlockData(assert, block.header, blockDataWithTransactions);
		assert.length(block.transactions, blockDataWithTransactions.transactions.length);
		assert.string(block.serialized);

		for (let index = 0; index < blockDataWithTransactions.transactions.length; index++) {
			assertTransactionData(
				assert,
				block.transactions[index].data,
				blockDataWithTransactions.transactions[index],
			);
		}
	});

	it("#fromHex - should create a block instance from hex", async ({ factory }) => {
		const block = await factory.fromHex(serialized);

		assertBlockData(assert, block.data, blockDataClone);
		assertBlockData(assert, block.header, blockDataClone);
		assert.equal(block.transactions, []);
		assert.equal(block.serialized, serialized);
	});

	it("#fromHex - should create a block instance with transactions from hex", async ({ factory }) => {
		const block = await factory.fromHex(serializedWithTransactions);

		assertBlockData(assert, block.data, blockDataWithTransactionsClone);
		assertBlockData(assert, block.header, blockDataWithTransactionsClone);
		assert.equal(block.serialized, serializedWithTransactions);

		// TODO: Check why transactions are not included
		// assert.length(block.transactions, blockDataWithTransactionsClone.transaction.length);
	});

	it("fromBytes - should create a block instance from a buffer", async ({ factory }) => {
		const block = await factory.fromBytes(Buffer.from(serialized, "hex"));

		assertBlockData(assert, block.data, blockDataClone);
		assertBlockData(assert, block.header, blockDataClone);
		assert.equal(block.transactions, []);
		assert.equal(block.serialized, serialized);
	});

	it("fromBytes - should create a block with transactions instance from a buffer", async ({ factory }) => {
		const block = await factory.fromBytes(Buffer.from(serializedWithTransactions, "hex"));

		assertBlockData(assert, block.data, blockDataWithTransactionsClone);
		assertBlockData(assert, block.header, blockDataWithTransactionsClone);
		assert.equal(block.serialized, serializedWithTransactions);

		// TODO: Check why transactions are not included
		// assert.length(block.transactions, blockDataWithTransactionsClone.transaction.length);
	});

	it("fromData - should create a block instance from an object", async (context) => {
		const block = await context.factory.fromData(blockData);

		assertBlockData(assert, block.data, blockData);
		assertBlockData(assert, block.header, blockData);
		assert.equal(block.transactions, []);
		assert.string(block.serialized);
	});

	it("fromData - should create a block with transactions instance from an object", async (context) => {
		const block = await context.factory.fromData(blockDataWithTransactions);

		assertBlockData(assert, block.data, blockDataWithTransactions);
		assertBlockData(assert, block.header, blockDataWithTransactions);
		assert.string(block.serialized);

		for (let index = 0; index < blockDataWithTransactions.transactions.length; index++) {
			assertTransactionData(
				assert,
				block.transactions[index].data,
				blockDataWithTransactions.transactions[index],
			);
		}
	});

	it("fromData - should throw on invalid input data - block property has an unexpected value", async ({
		factory,
	}) => {
		const b2 = Object.assign({}, blockData, { totalAmount: "abcd" });
		await assert.rejects(() => factory.fromData(b2), "Cannot convert abcd to a BigInt");
	});

	it("fromData - should throw on invalid input data - required block property is missing", async ({ factory }) => {
		delete blockDataClone.generatorPublicKey;
		await assert.rejects(
			() => factory.fromData(blockDataClone),
			" Invalid data: should have required property 'generatorPublicKey': undefined",
		);
	});

	it("fromData - should throw on invalid transaction data", async ({ factory }) => {
		delete blockDataWithTransactionsClone.transactions[0].id;

		await assert.rejects(
			() => factory.fromData(blockDataWithTransactionsClone),
			"Invalid data at .transactions[0]: should have required property '.id': undefined",
		);
	});

	it("fromJson - should create a block instance from JSON", async ({ factory }) => {
		const block = await factory.fromJson(blockDataJson);

		// Recalculated id
		blockDataClone.id = blockDataJson.id;

		assertBlockData(assert, block.data, blockDataClone);
		assertBlockData(assert, block.header, blockDataClone);
		assert.equal(block.transactions, []);
		assert.string(block.serialized);
	});

	it("fromJson - should create a block instance with transactions from JSON", async ({ factory }) => {
		const block = await factory.fromJson(blockDataWithTransactionsJson);

		// Recalculated id
		blockDataWithTransactionsClone.id = blockDataWithTransactionsJson.id;

		assertBlockData(assert, block.data, blockDataWithTransactionsClone);
		assertBlockData(assert, block.header, blockDataWithTransactionsClone);
		assert.string(block.serialized);
		assert.length(block.transactions, blockDataWithTransactionsClone.transactions.length);

		for (let index = 0; index < blockDataWithTransactionsClone.transactions.length; index++) {
			// Recalculated id
			blockDataWithTransactionsClone.transactions[index].id = block.transactions[index].data.id;

			assertTransactionData(
				assert,
				block.transactions[index].data,
				blockDataWithTransactionsClone.transactions[index],
			);
		}
	});
});
