import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Application, Services } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { generateMnemonic } from "bip39";

import { getWalletAttributeSet } from "../../internal/wallet-attributes";
import { FactoryBuilder } from "../factory-builder";

export const registerWalletFactory = (factoryBuilder: FactoryBuilder, app: Application): void => {
	factoryBuilder.set("Wallet", async ({ options }) => {
		const passphrase: string = options.passphrase || generateMnemonic();

		console.log("PASSPHRASE", passphrase);

		const wallet: Wallets.Wallet = new Wallets.Wallet(
			await app
				.get<Contracts.Crypto.IAddressFactory>(Identifiers.Cryptography.Identity.AddressFactory)
				.fromMnemonic(passphrase),
			new Services.Attributes.AttributeMap(getWalletAttributeSet()),
		);
		wallet.setPublicKey(
			await app
				.get<Contracts.Crypto.IPublicKeyFactory>(Identifiers.Cryptography.Identity.PublicKeyFactory)
				.fromMnemonic(passphrase),
		);
		return wallet;
	});
};
