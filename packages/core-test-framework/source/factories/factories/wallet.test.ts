import { Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { Types } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";

import cryptoConfig from "../../../../core/bin/config/testnet/crypto.json"; // TODO: Generate
import { describe, Sandbox } from "../../index";
import { FactoryBuilder } from "../factory-builder";
import { registerWalletFactory } from "./wallet";

type ServiceProvider = {
	name: string;
	path: string;
	klass: Types.Class<any, any[]>;
};

const addressBech32m: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-address-bech32").ServiceProvider,
	name: "@arkecosystem/core-crypto-address-bech32",
	path: "@arkecosystem/core-crypto-address-bech32",
};

const keyPairSchnorr: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-key-pair-schnorr").ServiceProvider,
	name: "@arkecosystem/core-crypto-key-pair-schnorr",
	path: "@arkecosystem/core-crypto-key-pair-schnorr",
};

describe<{
	factoryBuilder: FactoryBuilder;
}>("WalletFactory", ({ beforeEach, it, assert }) => {
	beforeEach(async (context) => {
		const sandbox = new Sandbox();

		sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoConfig);

		sandbox.app.bind(Identifiers.EventDispatcherService).toConstantValue({});
		await sandbox.registerServiceProvider(addressBech32m);
		await sandbox.registerServiceProvider(keyPairSchnorr);

		context.factoryBuilder = new FactoryBuilder();

		registerWalletFactory(context.factoryBuilder, sandbox.app);
	});

	it("should make a wallet", async ({ factoryBuilder }) => {
		const entity: Wallets.Wallet = await factoryBuilder.get("Wallet").make<Wallets.Wallet>();

		assert.instance(entity, Wallets.Wallet);
		assert.string(entity.getAddress());
		assert.string(entity.getPublicKey());
	});
});
