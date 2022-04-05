import { injectable } from "@arkecosystem/core-container";
import { Contracts } from "@arkecosystem/core-contracts";

type PartialRecord<K extends keyof any, T> = {
	[P in K]?: T;
};

type Data = PartialRecord<Contracts.Flags.Flag, string | number>;

@injectable()
export class EnvironmentGenerator {
	#data: Data = {};

	addInitialRecords(): EnvironmentGenerator {
		this.#data = {
			CORE_DB_HOST: "localhost",
			CORE_DB_PORT: 5432,
			CORE_LOG_LEVEL: "info",
			CORE_LOG_LEVEL_FILE: "info",
			CORE_P2P_HOST: "0.0.0.0",
			CORE_P2P_PORT: 4000,
			CORE_WEBHOOKS_HOST: "0.0.0.0",
			CORE_WEBHOOKS_PORT: 4004,
		};

		return this;
	}

	addRecord(key: Contracts.Flags.Flag, value: string | number): EnvironmentGenerator {
		this.#data[key] = value;

		return this;
	}

	generate(): Data {
		return this.#data;
	}
}
