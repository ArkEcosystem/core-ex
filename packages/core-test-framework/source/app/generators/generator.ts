import { Identities, Interfaces } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import passphrases from "../../internal/passphrases.json";
import { SandboxOptions, Wallet } from "../contracts";

export abstract class Generator {
	protected options: SandboxOptions = {
		core: {},
		crypto: {
			flags: {
				network: "unitnet",
				premine: "15300000000000000",
				delegates: 51,
				blocktime: 8,
				maxTxPerBlock: 150,
				maxBlockPayload: 2097152,
				rewardHeight: 75600,
				rewardAmount: 200000000,
				pubKeyHash: 23,
				wif: 186,
				token: "UARK",
				symbol: "UѦ",
				explorer: "http://uexplorer.ark.io",
				distribute: true,
			},
		},
	};

	public constructor(options?: SandboxOptions) {
		if (options) {
			this.options = { ...this.options, ...options };
		}
	}

	protected generateCoreDelegates(activeDelegates: number, pubKeyHash: number): Wallet[] {
		const wallets: Wallet[] = [];

		for (let i = 0; i < activeDelegates; i++) {
			const delegateWallet: Wallet = this.createWallet(pubKeyHash, passphrases[i]);
			delegateWallet.username = `genesis_${i + 1}`;

			wallets.push(delegateWallet);
		}

		return wallets;
	}

	protected createWallet(pubKeyHash: number, passphrase?: string): Wallet {
		if (!passphrase) {
			passphrase = generateMnemonic();
		}

		const keys: Interfaces.IKeyPair = Identities.Keys.fromPassphrase(passphrase);

		return {
			address: Identities.Address.fromPublicKey(keys.publicKey, pubKeyHash),
			passphrase,
			keys,
			username: undefined,
		};
	}
}
