import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Wallets } from "@arkecosystem/core-state";
import { BigNumber } from "@arkecosystem/utils";

import passphrases from "../../internal/passphrases.json";
import { knownAttributes } from "../../internal/wallet-attributes";
import { FactoryBuilder } from "../factory-builder";

export const registerRoundFactory = (factory: FactoryBuilder, app: Contracts.Kernel.Application): void => {
	factory.set("Round", async ({ options }) => {
		const publicKeys: string[] =
			options.publicKeys ||
			(await Promise.all(
				passphrases.map(
					async (passphrase: string) =>
						await app
							.get<Contracts.Crypto.IPublicKeyFactory>(Identifiers.Cryptography.Identity.PublicKeyFactory)
							.fromMnemonic(passphrase),
				),
			));

		return Promise.all(
			publicKeys.map(async (publicKey: string, index: number) => {
				const wallet = new Wallets.Wallet(
					await app
						.get<Contracts.Crypto.IAddressFactory>(Identifiers.Cryptography.Identity.AddressFactory)
						.fromPublicKey(publicKey),
					knownAttributes,
				);
				wallet.setPublicKey(publicKey);
				wallet.setAttribute("validator", {
					rank: undefined,
					round: options.round || 1,
					username: `genesis_${index + 1}`,
					voteBalance: BigNumber.make("300000000000000"),
				});
				return wallet;
			}),
		);
	});
};
