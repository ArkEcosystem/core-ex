import { Types } from "@arkecosystem/core-kernel";
import { copyFileSync, ensureDirSync, existsSync, writeFileSync, writeJSONSync } from "fs-extra";
import { resolve } from "path";
import { dirSync } from "tmp";

import passphrases from "../../internal/passphrases.json";
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

		this.writeValidators();

		this.writeEnvironment();

		this.writeApplication();

		return {
			app: resolve(this.destination, "app.json"),
			env: resolve(this.destination, ".env"),
			peers: resolve(this.destination, "peers.json"),
			root: this.destination,
			validators: resolve(this.destination, "validators.json"),
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

	private writeValidators(): void {
		const filePath: string = resolve(this.destination, "validators.json");

		if (this.options.crypto.passphrases) {
			writeJSONSync(filePath, { secrets: this.options.crypto.passphrases }, { spaces: 4 });
		} else {
			writeJSONSync(filePath, { secrets: passphrases }, { spaces: 4 });
		}
	}

	private writeEnvironment(): void {
		const filePath: string = resolve(this.destination, ".env");

		if (this.options.core.environment) {
			writeFileSync(filePath, this.generateEnvironment(this.options.core.environment));
		} else {
			copyFileSync(resolve(__dirname, "../../../../core/bin/config/testnet/.env"), filePath);
		}
	}

	private writeApplication(): void {
		const filePath: string = resolve(this.destination, "app.json");

		if (this.options.core.app) {
			writeJSONSync(filePath, this.options.core.app, { spaces: 4 });
		} else {
			copyFileSync(resolve(__dirname, "../../../../core/bin/config/testnet/app.json"), filePath);
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
