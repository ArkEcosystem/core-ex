import { Utils } from "@arkecosystem/core-kernel";
import { writeJSONSync } from "fs-extra";
import { join } from "path";

import { Generator, Wallet } from "./generator";

export class GenesisWalletGenerator extends Generator {
	#data?: Wallet;

	get(): Wallet {
		Utils.assert.defined(this.#data);
		return this.#data;
	}

	async generate(): Promise<GenesisWalletGenerator> {
		this.#data = await this.createWallet();

		return this;
	}

	write(dataPath: string) {
		Utils.assert.defined(this.#data);
		writeJSONSync(join(dataPath, "genesis-wallet.json"), this.#data, {
			spaces: 4,
		});
	}
}
