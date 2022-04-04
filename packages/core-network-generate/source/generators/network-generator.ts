import { Contracts } from "@arkecosystem/core-contracts";
import { Types, Utils } from "@arkecosystem/core-kernel";

export class NetworkGenerator {
	#data?: Types.JsonObject;

	get(): Types.JsonObject {
		Utils.assert.defined(this.#data);
		return this.#data;
	}

	generate(nethash: string, options: Contracts.NetworkGenerator.NetworkOptions): NetworkGenerator {
		this.#data = {
			client: {
				explorer: options.explorer,
				symbol: options.symbol,
				token: options.token,
			},
			messagePrefix: `${options.network} message:\n`,
			name: options.network,
			nethash,
			pubKeyHash: options.pubKeyHash,
			slip44: 1,
			wif: options.wif,
		};

		return this;
	}
}
