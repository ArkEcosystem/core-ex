import { Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { Types } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { BigNumber } from "@arkecosystem/utils";

import cryptoConfig from "../../../../core/bin/config/testnet/crypto.json"; // TODO: Generate
import { describe, Sandbox } from "../../index";
import { FactoryBuilder } from "../factory-builder";
import { registerRoundFactory } from "./round";

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

describe<{
	factoryBuilder: FactoryBuilder;
}>("RoundFactory", ({ beforeEach, it, assert }) => {
	beforeEach(async (context) => {
		const sandbox = new Sandbox();

		sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoConfig);

		sandbox.app.bind(Identifiers.EventDispatcherService).toConstantValue({});
		await sandbox.registerServiceProvider(addressBech32m);
		await sandbox.registerServiceProvider(keyPairSchnorr);

		context.factoryBuilder = new FactoryBuilder();

		registerRoundFactory(context.factoryBuilder, sandbox.app);
	});

	it("should create a round with validators", async ({ factoryBuilder }) => {
		const entity = await factoryBuilder.get("Round").make<Wallets.Wallet[]>();

		assert.array(entity);
		assert.gt(entity.length, 0);

		for (const validator of entity) {
			assert.instance(validator, Wallets.Wallet);
			assert.string(validator.getAddress());
			assert.string(validator.getPublicKey());
			assert.instance(validator.getBalance(), BigNumber);
			assert.instance(validator.getNonce(), BigNumber);
			assert.true(validator.isValidator());
		}
	});
});
