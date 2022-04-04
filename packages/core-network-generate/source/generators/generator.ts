import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Application } from "@arkecosystem/core-kernel";
import { generateMnemonic } from "bip39";

export type Wallet = {
	address: string;
	passphrase: string;
	keys: Contracts.Crypto.IKeyPair;
	username: string | undefined;
};

export class Generator {
	protected app: Application;

	public constructor(app: Application) {
		this.app = app;
	}

	protected async createWallet(): Promise<Wallet> {
		const passphrase = generateMnemonic(256);

		const keys: Contracts.Crypto.IKeyPair = await this.app
			.get<Contracts.Crypto.IKeyPairFactory>(Identifiers.Cryptography.Identity.KeyPairFactory)
			.fromMnemonic(passphrase);

		return {
			address: await this.app
				.get<Contracts.Crypto.IAddressFactory>(Identifiers.Cryptography.Identity.AddressFactory)
				.fromPublicKey(keys.publicKey),
			keys,
			passphrase,
			username: undefined,
		};
	}
}
