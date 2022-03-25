import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { Types } from "@arkecosystem/core-kernel";
import { BigNumber } from "@arkecosystem/utils";

import cryptoConfig from "../../../../core/bin/config/testnet/crypto.json"; // TODO: Generate
import { describe, Sandbox } from "../../index";
import { FactoryBuilder } from "../factory-builder";
import { registerBlockFactory } from "./block";

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

const cryptoBlock: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-block").ServiceProvider,
	name: "@arkecosystem/core-crypto-block",
	path: "@arkecosystem/core-crypto-block",
};

const cryptoSerializer: ServiceProvider = {
	klass: require("@arkecosystem/core-serializer").ServiceProvider,
	name: "@arkecosystem/core-serializer",
	path: "@arkecosystem/core-serializer",
};

const cryptoTransaction: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-transaction").ServiceProvider,
	name: "@arkecosystem/core-crypto-transaction",
	path: "@arkecosystem/core-crypto-transaction",
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

describe<{
	sandbox: Sandbox;
	factoryBuilder: FactoryBuilder;
}>("BlockFactory", ({ beforeEach, it, assert }) => {
	beforeEach(async (context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoConfig);
		context.sandbox.app.bind(Identifiers.EventDispatcherService).toConstantValue({});

		await context.sandbox.registerServiceProvider(addressBech32m);
		await context.sandbox.registerServiceProvider(keyPairSchnorr);
		await context.sandbox.registerServiceProvider(signatureSchnorr);
		await context.sandbox.registerServiceProvider(cryptoBlock);
		await context.sandbox.registerServiceProvider(cryptoSerializer);
		await context.sandbox.registerServiceProvider(cryptoTransaction);
		await context.sandbox.registerServiceProvider(hashBcrypto);
		await context.sandbox.registerServiceProvider(cryptoValidation);

		context.factoryBuilder = new FactoryBuilder();
		registerBlockFactory(context.factoryBuilder, context.sandbox.app);
	});

	it("should create a single block", async ({ factoryBuilder }) => {
		const entity = await factoryBuilder.get("Block").make<Contracts.Crypto.IBlock>();

		assert.string(entity.data.blockSignature);
		assert.string(entity.data.generatorPublicKey);
		assert.number(entity.data.height);
		assert.string(entity.data.id);
		assert.number(entity.data.numberOfTransactions);
		assert.string(entity.data.payloadHash);
		assert.number(entity.data.payloadLength);
		assert.string(entity.data.previousBlock);
		assert.instance(entity.data.reward, BigNumber);
		assert.number(entity.data.timestamp);
		assert.instance(entity.data.totalAmount, BigNumber);
		assert.instance(entity.data.totalFee, BigNumber);
		assert.number(entity.data.version);
		assert.string(entity.serialized);
		assert.array(entity.transactions);
	});

	it("should create a single block with previous block in options", async ({ factoryBuilder }) => {
		const previousBlock = await factoryBuilder.get("Block").make<Contracts.Crypto.IBlock>();

		const options = {
			getPreviousBlock(): Contracts.Crypto.IBlockData {
				return previousBlock.data;
			},
		};

		const entity = await factoryBuilder.get("Block").withOptions(options).make<Contracts.Crypto.IBlock>();

		assert.string(entity.data.blockSignature);
		assert.string(entity.data.generatorPublicKey);
		assert.number(entity.data.height);
		assert.string(entity.data.id);
		assert.number(entity.data.numberOfTransactions);
		assert.string(entity.data.payloadHash);
		assert.number(entity.data.payloadLength);
		assert.string(entity.data.previousBlock);
		assert.instance(entity.data.reward, BigNumber);
		assert.number(entity.data.timestamp);
		assert.instance(entity.data.totalAmount, BigNumber);
		assert.instance(entity.data.totalFee, BigNumber);
		assert.number(entity.data.version);
		assert.string(entity.serialized);
		assert.array(entity.transactions);
	});

	// it("should create a single block with transactions in options", async ({ factoryBuilder }) => {
	// 	const options = {
	// 		transactionsCount: 1,
	// 	};

	// 	const entity = await factoryBuilder.get("Block").withOptions(options).make<Contracts.Crypto.IBlock>();

	// 	assert.string(entity.data.blockSignature);
	// 	assert.string(entity.data.generatorPublicKey);
	// 	assert.number(entity.data.height);
	// 	assert.string(entity.data.id);
	// 	assert.number(entity.data.numberOfTransactions);
	// 	assert.string(entity.data.payloadHash);
	// 	assert.number(entity.data.payloadLength);
	// 	assert.string(entity.data.previousBlock);
	// 	assert.instance(entity.data.reward, BigNumber);
	// 	assert.number(entity.data.timestamp);
	// 	assert.instance(entity.data.totalAmount, BigNumber);
	// 	assert.instance(entity.data.totalFee, BigNumber);
	// 	assert.number(entity.data.version);
	// 	assert.string(entity.serialized);
	// 	assert.array(entity.transactions);
	// });
});
