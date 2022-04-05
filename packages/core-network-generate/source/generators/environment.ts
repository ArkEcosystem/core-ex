import { stringifySync } from "envfile";
import { writeFileSync } from "fs-extra";
import { join } from "path";

type Data = Record<string, string | number>;

export class EnvironmentGenerator {
	#data: Data = {
		CORE_DB_HOST: "localhost",
		CORE_DB_PORT: 5432,
		CORE_LOG_LEVEL: "info",
		CORE_LOG_LEVEL_FILE: "info",
		CORE_P2P_HOST: "0.0.0.0",
		CORE_P2P_PORT: 4000,
		CORE_WEBHOOKS_HOST: "0.0.0.0",
		CORE_WEBHOOKS_PORT: 4004,
	};

	get(): Data {
		return this.#data;
	}

	generate(options: Data): EnvironmentGenerator {
		this.#data = {
			...this.#data,
			...options,
		};

		return this;
	}

	write(dataPath: string) {
		writeFileSync(join(dataPath, ".env"), stringifySync(this.#data));
	}
}
