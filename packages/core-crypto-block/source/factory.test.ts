import { Contracts, Identifiers } from "@arkecosystem/core-contracts";

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
import { blockData, serialized } from "../test/fixtures/block";
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
}>("BlockFactory", ({ it, assert, beforeEach, beforeAll }) => {
	beforeAll((context) => {
		context.expectBlock = ({ data }: { data: Contracts.Crypto.IBlockData }) => {
			// delete data.idHex;

			const blockWithoutTransactions: Contracts.Crypto.IBlockData = { ...dummyBlock };
			// blockWithoutTransactions.reward = blockWithoutTransactions.reward;
			// blockWithoutTransactions.totalAmount = blockWithoutTransactions.totalAmount;
			// blockWithoutTransactions.totalFee = blockWithoutTransactions.totalFee;
			delete blockWithoutTransactions.transactions;

			assert.equal(data, blockWithoutTransactions);
		};
	});

	beforeEach(async (context) => {
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

		assert.equal(block.data, blockData);
		assert.equal(block.header, blockData);
		assert.equal(block.transactions, []);
		assert.string(block.serialized);
	});

	it("fromHex - should create a block instance from hex", async ({ factory }) => {
		// context.expectBlock(
		// 	await context.factory.fromHex(
		// 		(await context.serializer.serializeWithTransactions(dummyBlock)).toString("hex"),
		// 	),
		// );
		const block = await factory.fromHex(serialized);

		console.log(blockData);
		console.log(block.data);

		// assert.equal(block.data, blockData);
		// assert.equal(block.header, blockData);
		assert.equal(block.transactions, []);
		assert.equal(block.serialized, serialized);
	});

	// it("fromBytes - should create a block instance from a buffer", (context) => {
	// 	context.expectBlock(BlockFactory.fromBytes(Serializer.serializeWithTransactions(dummyBlock)));
	// });

	// it("fromData - should create a block instance from an object", async (context) => {
	// 	context.expectBlock(await context.factory.fromData(dummyBlock));
	// });

	// it("fromData - should throw on invalid input data - block property has an unexpected value", () => {
	// 	const b1 = Object.assign({}, blockWithExceptions, { timestamp: "abcd" });
	// 	assert.throws(() => BlockFactory.fromData(b1));

	// 	const b2 = Object.assign({}, blockWithExceptions, { totalAmount: "abcd" });
	// 	assert.throws(() => BlockFactory.fromData(b2));
	// });

	// it("fromData - should throw on invalid input data - required block property is missing", () => {
	// 	const b = Object.assign({}, blockWithExceptions);
	// 	delete b.generatorPublicKey;
	// 	assert.throws(() => BlockFactory.fromData(b));
	// });

	// it("fromData - should throw on invalid transaction data", () => {
	// 	const b = Object.assign({}, dummyBlock);
	// 	const txId = b.transactions[1].id;

	// 	delete b.transactions[1].id;

	// 	assert.throws(() => BlockFactory.fromData(b));

	// 	// Revert changes...
	// 	b.transactions[1].id = txId;
	// });

	// it("fromJson - should create a block instance from JSON", (context) => {
	// 	context.expectBlock(BlockFactory.fromJson(BlockFactory.fromData(dummyBlock).toJson()));
	// });
});
