import { Types } from "@arkecosystem/core-kernel";
import { copyFileSync, ensureDirSync, existsSync, writeFileSync, writeJSONSync } from "fs-extra";
import { resolve } from "path";
import { dirSync } from "tmp";

import { CoreConfigPaths } from "../contracts";
import { Generator } from "./generator";


export class CoreGenerator extends Generator {

	private destination!: string;


	public generate(): CoreConfigPaths {
		this.destination = resolve(__dirname, `${dirSync().name}/${this.options.crypto.network}`);

		if (existsSync(this.destination)) {
			throw new Error(`${this.destination} already exists.`);
		}

		ensureDirSync(this.destination);

		this.writePeers();

		this.writeDelegates(
			this.generateCoreDelegates(this.options.crypto.flags.delegates, this.options.crypto.flags.pubKeyHash),
		);

		this.writeEnvironment();

		this.writeApplication();

		return {
			root: this.destination,
			env: resolve(this.destination, ".env"),
			app: resolve(this.destination, "app.json"),
			delegates: resolve(this.destination, "delegates.json"),
			peers: resolve(this.destination, "peers.json"),
		};
	}


	private writePeers(): void {
		const filePath: string = resolve(this.destination, "peers.json");

		if (this.options.core.peers) {
			writeJSONSync(filePath, this.options.core.peers, { spaces: 4 });
		} else {
			writeJSONSync(filePath, { list: [] }, { spaces: 4 });
		}
	}


	private writeDelegates(delegates): void {
		const filePath: string = resolve(this.destination, "delegates.json");

		if (this.options.core.delegates) {
			writeJSONSync(filePath, this.options.core.delegates, { spaces: 4 });
		} else {
			writeJSONSync(filePath, { secrets: delegates.map((d) => d.passphrase) }, { spaces: 4 });
		}
	}


	private writeEnvironment(): void {
		const filePath: string = resolve(this.destination, ".env");

		if (this.options.core.environment) {
			writeFileSync(filePath, this.generateEnvironment(this.options.core.environment));
		} else {
			copyFileSync(require.resolve("@arkecosystem/core/bin/config/testnet/.env"), filePath);
		}
	}


	private writeApplication(): void {
		const filePath: string = resolve(this.destination, "app.json");

		if (this.options.core.app) {
			writeJSONSync(filePath, this.options.core.app, { spaces: 4 });
		} else {
			copyFileSync(require.resolve("@arkecosystem/core/bin/config/testnet/app.json"), filePath);
		}
	}


	private generateEnvironment(environment: Types.JsonObject): string {
		let result = "";

		for (const [key, value] of Object.entries(environment)) {
			result += `${key}=${value}\n`;
		}

		return result;
	}
}
