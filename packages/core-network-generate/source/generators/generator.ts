import { injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Application } from "@arkecosystem/core-kernel";

import { Identifiers as InternalIdentifiers } from "../identifiers";
import { MnemonicGenerator } from "./mnemonic";

export type Wallet = {
	address: string;
	passphrase: string;
	keys: Contracts.Crypto.IKeyPair;
	username: string | undefined;
};

@injectable()
export class Generator {
	protected app: Application;

	public constructor(app: Application) {
		this.app = app;
	}

	protected async createWallet(mnemonic?: string): Promise<Wallet> {
		if (!mnemonic) {
			mnemonic = this.app.get<MnemonicGenerator>(InternalIdentifiers.Generator.Mnemonic).generate();
		}

		const keys: Contracts.Crypto.IKeyPair = await this.app
			.get<Contracts.Crypto.IKeyPairFactory>(Identifiers.Cryptography.Identity.KeyPairFactory)
			.fromMnemonic(mnemonic);

		return {
			address: await this.app
				.get<Contracts.Crypto.IAddressFactory>(Identifiers.Cryptography.Identity.AddressFactory)
				.fromPublicKey(keys.publicKey),
			keys,
			passphrase: mnemonic,
			username: undefined,
		};
	}
}
