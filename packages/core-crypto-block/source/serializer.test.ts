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
import { describe, Sandbox } from "../../core-test-framework";
import { ServiceProvider as CoreValidation } from "../../core-validation";
import { blockData, blockDataWithTransactions } from "../test/fixtures/block";
import { assertBlockData, assertTransactionData } from "../test/helpers/asserts";
import { Deserializer } from "./deserializer";
import { IDFactory } from "./id.factory";
import { Serializer } from "./serializer";

describe<{
	sandbox: Sandbox;
	serializer: Serializer;
	deserializer: Deserializer;
}>("Serializer", ({ it, assert, beforeEach }) => {
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
		context.sandbox.app.bind(Identifiers.Cryptography.Block.IDFactory).to(IDFactory);

		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(crypto);

		context.serializer = context.sandbox.app.resolve(Serializer);
		context.deserializer = context.sandbox.app.resolve(Deserializer);
	});

	it("#size - should return size", ({ serializer }) => {
		assert.equal(
			// @ts-ignore
			serializer.size({
				data: blockData,
				transactions: [],
			}),
			204,
		);
	});

	it("#size - should return size with transactions", async ({ serializer, sandbox }) => {
		assert.equal(
			// @ts-ignore
			serializer.size({
				data: blockDataWithTransactions,
				transactions: await Promise.all(
					blockDataWithTransactions.transactions.map(async (tx) =>
						sandbox.app
							.get<Contracts.Crypto.ITransactionFactory>(Identifiers.Cryptography.Transaction.Factory)
							.fromData(tx),
					),
				),
			}),
			584,
		);
	});

	it("#serialize - should serialize and deserialize block", async ({ serializer, deserializer }) => {
		const serialized = await serializer.serialize(blockData);

		const deserialized = await deserializer.deserialize(serialized);

		assertBlockData(assert, deserialized.data, blockData);
	});

	it("#serialize - should serialize and deserialize block with transactions", async ({
		serializer,
		deserializer,
	}) => {
		const serialized = await serializer.serializeWithTransactions(blockDataWithTransactions);

		const deserialized = await deserializer.deserialize(serialized);

		assertBlockData(assert, deserialized.data, blockDataWithTransactions);

		assert.length(deserialized.data.transactions, blockDataWithTransactions.transactions.length);

		for (let index = 0; index < blockDataWithTransactions.transactions.length; index++) {
			assertTransactionData(
				assert,
				deserialized.data.transactions[index],
				blockDataWithTransactions.transactions[index],
			);
		}
	});
});
