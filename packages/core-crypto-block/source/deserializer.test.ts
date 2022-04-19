import { Identifiers } from "@arkecosystem/core-contracts";

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
import { blockData, serialized } from "../test/fixtures/block";
import { Deserializer } from "./deserializer";
import { IDFactory } from "./id.factory";
import { Serializer } from "./serializer";

describe<{
	sandbox: Sandbox;
	deserializer: Deserializer;
}>("block deserializer", ({ it, assert, beforeEach }) => {
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

		context.deserializer = context.sandbox.app.resolve(Deserializer);
	});

	it("should correctly deserialize a block", async ({ deserializer }) => {
		const deserialized = (await deserializer.deserialize(Buffer.from(serialized, "hex"))).data;

		const blockFields = [
			"id",
			"timestamp",
			"version",
			"height",
			"previousBlock",
			"numberOfTransactions",
			"totalAmount",
			"totalFee",
			"reward",
			"payloadLength",
			"payloadHash",
			"generatorPublicKey",
			"blockSignature",
		];
		for (const field of blockFields) {
			assert.equal(deserialized[field].toString(), blockData[field].toString());
		}

		// assert.length(deserialized.transactions, dummyBlock2.data.transactions.length);

		// const transactionFields = [
		// 	"id",
		// 	"type",
		// 	"timestamp",
		// 	"senderPublicKey",
		// 	"fee",
		// 	"amount",
		// 	"recipientId",
		// 	"signature",
		// ];
		// for (const tx of deserialized.transactions) {
		// 	const dummyBlockTx = dummyBlock2.data.transactions.find((dummyTx) => dummyTx.id === tx.id);
		// 	assert.defined(dummyBlockTx);
		// 	for (const field of transactionFields) {
		// 		assert.equal(tx[field].toString(), dummyBlockTx[field].toString());
		// 	}
		// }
	});
});
