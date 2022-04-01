import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { generateMnemonic } from "bip39";

import { FactoryBuilder } from "../factory-builder";
import { generateApp } from "./generate-app";

export const registerIdentityFactory = async (
	factory: FactoryBuilder,
	config: Contracts.Crypto.NetworkConfig,
): Promise<void> => {
	const app = await generateApp(config);

	factory.set("Identity", async ({ options }) => {
		const passphrase: string = options.passphrase || generateMnemonic();
		const keys = await app
			.get<Contracts.Crypto.IKeyPairFactory>(Identifiers.Cryptography.Identity.KeyPairFactory)
			.fromMnemonic(passphrase);
		return {
			address: await app
				.get<Contracts.Crypto.IAddressFactory>(Identifiers.Cryptography.Identity.AddressFactory)
				.fromMnemonic(passphrase),
			keys,
			passphrase,
			privateKey: keys.privateKey,
			publicKey: keys.publicKey,
			wif: await app
				.get<Contracts.Crypto.IWIFFactory>(Identifiers.Cryptography.Identity.WifFactory)
				.fromMnemonic(passphrase),
		};
	});
};
