import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { Types } from "@arkecosystem/core-kernel";

import cryptoConfig from "../../../../core/bin/config/testnet/crypto.json"; // TODO: Generate
import { describe, Sandbox } from "../../index";
import { FactoryBuilder } from "../factory-builder";
import { registerIdentityFactory } from "./identity";

interface Identity {
	keys: Contracts.Crypto.IKeyPair;
	publicKey: string;
	privateKey: string;
	address: string;
	wif: string;
	passphrase: string;
	secondPassphrase?: string;
}

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

const cryptoWif: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-wif").ServiceProvider,
	name: "@arkecosystem/core-crypto-wif",
	path: "@arkecosystem/core-crypto-wif",
};

describe<{
	sandbox: Sandbox;
	factoryBuilder: FactoryBuilder;
}>("IdentityFactory", ({ beforeAll, it, assert }) => {
	beforeAll(async (context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.sandbox.app.bind(Identifiers.EventDispatcherService).toConstantValue({});
		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoConfig);
		await context.sandbox.registerServiceProvider(addressBech32m);
		await context.sandbox.registerServiceProvider(keyPairSchnorr);
		await context.sandbox.registerServiceProvider(cryptoWif);

		context.factoryBuilder = new FactoryBuilder();

		registerIdentityFactory(context.factoryBuilder, context.sandbox.app);
	});

	it("should make an identity with a single passphrase", async ({ factoryBuilder }) => {
		const entity: Identity = await factoryBuilder.get("Identity").make<Identity>();

		assert.object(entity.keys);
		assert.string(entity.keys.publicKey);
		assert.string(entity.keys.privateKey);
		assert.string(entity.publicKey);
		assert.string(entity.privateKey);
		assert.string(entity.address);
		assert.string(entity.wif);
		assert.string(entity.passphrase);
	});
});
