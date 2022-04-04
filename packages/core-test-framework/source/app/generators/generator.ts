// import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
// import { generateMnemonic } from "bip39";

// import passphrases from "../../internal/passphrases.json";
import { SandboxOptions } from "../contracts";

export abstract class Generator {
	protected options: SandboxOptions = {
		core: {},
		crypto: {
			blockTime: 8,
			distribute: true,
			explorer: "http://uexplorer.ark.io",
			maxBlockPayload: 2_097_152,
			maxTxPerBlock: 150,
			network: "unitnet",
			premine: "15300000000000000",
			pubKeyHash: 23,
			rewardAmount: "200_000_000",
			rewardHeight: 75_600,
			symbol: "UѦ",
			token: "UARK",
			validators: 51,
			wif: 186,
		},
	};

	public constructor(options?: SandboxOptions) {
		if (options) {
			this.options = { ...this.options, ...options };
		}
	}
}
