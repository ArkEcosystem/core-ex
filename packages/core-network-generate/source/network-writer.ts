import { injectable } from "@arkecosystem/core-container";
import { Types } from "@arkecosystem/core-kernel";
import { stringifySync } from "envfile";
import { writeFileSync, writeJSONSync } from "fs-extra";
import { join } from "path";

@injectable()
export class NetworkWriter {
	#dataPath: string;

	constructor(dataPath: string) {
		this.#dataPath = dataPath;
	}

	writeApp(appData: Types.JsonObject) {
		writeJSONSync(join(this.#dataPath, "app.json"), appData, {
			spaces: 4,
		});
	}

	writeEnvironment(environment: Record<string, string | number>) {
		writeFileSync(join(this.#dataPath, ".env"), stringifySync(environment));
	}

	writePeers(peers: string[]) {
		writeJSONSync(
			join(this.#dataPath, "peers.json"),
			{ list: peers },
			{
				spaces: 4,
			},
		);
	}

	writeGenesisWallet(wallet) {
		writeJSONSync(join(this.#dataPath, "genesis-wallet.json"), wallet, {
			spaces: 4,
		});
	}

	writeValidators(mnemonics: string[]) {
		writeJSONSync(
			join(this.#dataPath, "validators.json"),
			{
				secrets: mnemonics,
			},
			{
				spaces: 4,
			},
		);
	}

	writeCrypto(genesisBlock, milestones, network) {
		writeJSONSync(
			join(this.#dataPath, "crypto.json"),
			{
				genesisBlock,
				milestones,
				network,
			},
			{
				spaces: 4,
			},
		);
	}
}
