import { Types, Utils } from "@arkecosystem/core-kernel";
import { readJSONSync, writeJSONSync } from "fs-extra";
import { join, resolve } from "path";

export class AppGenerator {
	#data?: Types.JsonObject;

	public constructor() {}

	get() {
		Utils.assert.defined(this.#data);
		return this.#data;
	}

	generate() {
		this.#data = readJSONSync(resolve(__dirname, "../../../core/bin/config/testnet/app.json"));

		return this;
	}

	write(dataPath: string) {
		Utils.assert.defined(this.#data);
		writeJSONSync(join(dataPath, "app.json"), this.#data, {
			spaces: 4,
		});
	}
}
