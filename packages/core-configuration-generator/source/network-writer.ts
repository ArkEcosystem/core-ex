import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts } from "@arkecosystem/core-contracts";
import { Types } from "@arkecosystem/core-kernel";
import { stringifySync } from "envfile";
import { writeFileSync, writeJSONSync } from "fs-extra";
import { join } from "path";

import { EnviromentData, Wallet } from "./contracts";
import { Identifiers } from "./identifiers";

@injectable()
export class NetworkWriter {
	@inject(Identifiers.DataPath)
	private dataPath: string;

	writeApp(appData: Types.JsonObject): void {
		writeJSONSync(join(this.dataPath, "app.json"), appData, {
			spaces: 4,
		});
	}

	writeEnvironment(environment: EnviromentData): void {
		writeFileSync(join(this.dataPath, ".env"), stringifySync(environment));
	}

	writePeers(peers: string[]) {
		writeJSONSync(
			join(this.dataPath, "peers.json"),
			{ list: peers },
			{
				spaces: 4,
			},
		);
	}

	writeGenesisWallet(wallet: Wallet): void {
		writeJSONSync(join(this.dataPath, "genesis-wallet.json"), wallet, {
			spaces: 4,
		});
	}

	writeValidators(mnemonics: string[]): void {
		writeJSONSync(
			join(this.dataPath, "validators.json"),
			{
				secrets: mnemonics,
			},
			{
				spaces: 4,
			},
		);
	}

	writeCrypto(
		genesisBlock: Contracts.Crypto.IBlockData,
		milestones: Types.JsonObject[],
		network: Types.JsonObject,
	): void {
		writeJSONSync(
			join(this.dataPath, "crypto.json"),
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
