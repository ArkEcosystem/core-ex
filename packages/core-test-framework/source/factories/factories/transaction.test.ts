import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { Types } from "@arkecosystem/core-kernel";

import cryptoConfig from "../../../../core/bin/config/testnet/crypto.json"; // TODO: Generate
import { describe, Sandbox } from "../../index";
import passphrases from "../../internal/passphrases.json";
import { FactoryBuilder } from "../factory-builder";
import { registerTransactionFactory } from "./transaction";

type ServiceProvider = {
	name: string;
	path: string;
	klass: Types.Class<any, any[]>;
};

const addressBech32m: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-address-bech32m").ServiceProvider,
	name: "@arkecosystem/core-crypto-address-bech32m",
	path: "@arkecosystem/core-crypto-address-bech32m",
};

const keyPairSchnorr: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-key-pair-schnorr").ServiceProvider,
	name: "@arkecosystem/core-crypto-key-pair-schnorr",
	path: "@arkecosystem/core-crypto-key-pair-schnorr",
};

const signatureSchnorr: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-signature-schnorr").ServiceProvider,
	name: "@arkecosystem/core-crypto-signature-schnorr",
	path: "@arkecosystem/core-crypto-signature-schnorr",
};

const hashBcrypto: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-hash-bcrypto").ServiceProvider,
	name: "@arkecosystem/core-crypto-hash-bcrypto",
	path: "@arkecosystem/core-crypto-hash-bcrypto",
};

const cryptoValidation: ServiceProvider = {
	klass: require("@arkecosystem/core-validation").ServiceProvider,
	name: "@arkecosystem/core-validation",
	path: "@arkecosystem/core-validation",
};

const transferTransaction: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-transaction-transfer").ServiceProvider,
	name: "@arkecosystem/core-crypto-transaction-transfer",
	path: "@arkecosystem/core-crypto-transaction-transfer",
};

const cryptoTransaction: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-transaction").ServiceProvider,
	name: "@arkecosystem/core-crypto-transaction",
	path: "@arkecosystem/core-crypto-transaction",
};

describe<{
	sandbox: Sandbox;
	factoryBuilder: FactoryBuilder;
}>("TransactionFactory", ({ beforeEach, it, assert }) => {
	beforeEach(async (context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoConfig);

		context.sandbox.app.bind(Identifiers.EventDispatcherService).toConstantValue({});
		await context.sandbox.registerServiceProvider(addressBech32m);
		await context.sandbox.registerServiceProvider(keyPairSchnorr);
		await context.sandbox.registerServiceProvider(signatureSchnorr);
		await context.sandbox.registerServiceProvider(hashBcrypto);
		await context.sandbox.registerServiceProvider(cryptoValidation);
		await context.sandbox.registerServiceProvider(cryptoTransaction);

		context.factoryBuilder = new FactoryBuilder();
		registerTransactionFactory(context.factoryBuilder, context.sandbox.app);
	});

	it("Transfer - should create a builder", async ({ factoryBuilder }) => {
		const transaction: Contracts.Crypto.ITransaction = await factoryBuilder.get("Transfer").make();
		assert.undefined(transaction.data.signature);
		assert.undefined(transaction.data.signatures);
	});

	it("Transfer - should create a builder with options", async ({ factoryBuilder, sandbox }) => {
		const options = {
			expiration: 2,
			fee: 2,
			nonce: 1,
			senderPublicKey: sandbox.app
				.get<Contracts.Crypto.IPublicKeyFactory>(Identifiers.Cryptography.Identity.PublicKeyFactory)
				.fromMnemonic(passphrases[0]),
			timestamp: 1,
			vendorField: "Dummy Field",
			version: 2,
		};

		const transaction: Contracts.Crypto.ITransaction = await factoryBuilder
			.get("Transfer")
			.withOptions(options)
			.withStates("vendorField")
			.make();

		assert.undefined(transaction.data.signature);
		assert.undefined(transaction.data.signatures);
		assert.defined(transaction.data.vendorField);

		// TODO: Check all options
	});

	it("Transfer - should create a builder with vendor field", async ({ factoryBuilder }) => {
		const transaction: Contracts.Crypto.ITransaction = await factoryBuilder
			.get("Transfer")
			.withStates("vendorField")
			.make();

		assert.undefined(transaction.data.signature);
		assert.undefined(transaction.data.signatures);
		assert.defined(transaction.data.vendorField);
	});

	// it("Transfer - should sign it with a single passphrase", async ({ factoryBuilder }) => {
	// 	const transaction: Contracts.Crypto.ITransaction = await factoryBuilder
	// 		.get("Transfer")
	// 		.withStates("sign")
	// 		.make();

	// 	assert.undefined(transaction.data.signature);
	// 	assert.undefined(transaction.data.signatures);
	// 	// assert.true(transaction.verify());
	// });

	// it("Transfer - should sign it with multiple passphrases", () => {
	//     const transaction: Interfaces.ITransaction = factory.get("Transfer").withStates("sign", "multiSign").make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).toBeUndefined();
	//     expect(transaction.data.signatures).not.toBeUndefined();
	//     // todo: verify multi signatures
	//     // expect(transaction.verify()).toBeTrue();
	// });

	it("ValidatorRegistration - should create a signature builder", async ({ factoryBuilder }) => {
		const transaction: Contracts.Crypto.ITransaction = await factoryBuilder.get("ValidatorRegistration").make();

		assert.undefined(transaction.data.signature);
		assert.undefined(transaction.data.signatures);
	});

	// it("ValidatorRegistration - should sign it with a single passphrase", () => {
	//     const transaction: Interfaces.ITransaction = factory.get("DelegateRegistration").withStates("sign").make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).toBeUndefined();
	//     expect(transaction.data.signatures).toBeUndefined();
	//     expect(transaction.verify()).toBeTrue();
	// });

	// it("ValidatorRegistration - should sign it with a second passphrase", () => {
	//     const transaction: Interfaces.ITransaction = factory
	//         .get("DelegateRegistration")
	//         .withStates("sign", "secondSign")
	//         .make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).not.toBeUndefined();
	//     expect(transaction.data.signatures).toBeUndefined();
	//     expect(transaction.verify()).toBeTrue();
	// });

	it("ValidatorResignation - should create a signature builder", async ({ factoryBuilder }) => {
		const transaction: Contracts.Crypto.ITransaction = await factoryBuilder.get("ValidatorResignation").make();

		assert.undefined(transaction.data.signature);
		assert.undefined(transaction.data.signatures);
	});

	// it("ValidatorResignation - should sign it with a single passphrase", () => {
	//     const transaction: Interfaces.ITransaction = factory.get("DelegateResignation").withStates("sign").make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).toBeUndefined();
	//     expect(transaction.data.signatures).toBeUndefined();
	//     expect(transaction.verify()).toBeTrue();
	// });

	// it("ValidatorResignation - should sign it with a second passphrase", () => {
	//     const transaction: Interfaces.ITransaction = factory
	//         .get("DelegateResignation")
	//         .withStates("sign", "secondSign")
	//         .make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).not.toBeUndefined();
	//     expect(transaction.data.signatures).toBeUndefined();
	//     expect(transaction.verify()).toBeTrue();
	// });

	it("Vote - should create a builder", async ({ factoryBuilder }) => {
		const transaction: Contracts.Crypto.ITransaction = await factoryBuilder.get("Vote").make();

		assert.undefined(transaction.data.signature);
		assert.undefined(transaction.data.signatures);
	});

	// it("Vote - should sign it with a single passphrase", () => {
	//     const transaction: Interfaces.ITransaction = factory.get("Vote").withStates("sign").make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).toBeUndefined();
	//     expect(transaction.data.signatures).toBeUndefined();
	//     expect(transaction.verify()).toBeTrue();
	// });

	// it("Vote - should sign it with multiple passphrases", () => {
	//     const transaction: Interfaces.ITransaction = factory.get("Vote").withStates("sign", "multiSign").make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).toBeUndefined();
	//     expect(transaction.data.signatures).not.toBeUndefined();
	// });

	it("Unvote - should create a builder", async ({ factoryBuilder }) => {
		const transaction: Contracts.Crypto.ITransaction = await factoryBuilder.get("Unvote").make();

		assert.undefined(transaction.data.signature);
		assert.undefined(transaction.data.signatures);
	});

	// it("Unvote - should sign it with a single passphrase", () => {
	//     const transaction: Interfaces.ITransaction = factory.get("Unvote").withStates("sign").make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).toBeUndefined();
	//     expect(transaction.data.signatures).toBeUndefined();
	//     expect(transaction.verify()).toBeTrue();
	// });

	// it("Unvote - should sign it with multiple passphrases", () => {
	//     const transaction: Interfaces.ITransaction = factory.get("Unvote").withStates("sign", "multiSign").make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).toBeUndefined();
	//     expect(transaction.data.signatures).not.toBeUndefined();
	// });

	it("MultiSignature - should create a builder", async ({ factoryBuilder }) => {
		const transaction: Contracts.Crypto.ITransaction = await factoryBuilder.get("MultiSignature").make();

		assert.undefined(transaction.data.signature);
		assert.undefined(transaction.data.signatures);
	});

	// it("MultiSignature - should sign it with multiple passphrases", () => {
	//     const transaction: Interfaces.ITransaction = factory
	//         .get("MultiSignature")
	//         .withStates("multiSign", "sign")
	//         .make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).toBeUndefined();
	//     expect(transaction.data.signatures).not.toBeUndefined();
	//     expect(transaction.verify()).toBeTrue();
	// });

	it("MultiPayment - should create a builder", async ({ factoryBuilder }) => {
		const transaction: Contracts.Crypto.ITransaction = await factoryBuilder.get("MultiPayment").make();

		assert.undefined(transaction.data.signature);
		assert.undefined(transaction.data.signatures);
	});

	// it("MultiPayment - should sign it with a single passphrase", () => {
	//     const transaction: Interfaces.ITransaction = factory.get("MultiPayment").withStates("sign").make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).toBeUndefined();
	//     expect(transaction.data.signatures).toBeUndefined();
	//     expect(transaction.verify()).toBeTrue();
	// });

	// it("MultiPayment - should sign it with multiple passphrases", () => {
	//     const transaction: Interfaces.ITransaction = factory
	//         .get("MultiPayment")
	//         .withStates("sign", "multiSign")
	//         .make();

	//     expect(transaction.data.signature).not.toBeUndefined();
	//     expect(transaction.data.secondSignature).toBeUndefined();
	//     expect(transaction.data.signatures).not.toBeUndefined();
	// });
});
