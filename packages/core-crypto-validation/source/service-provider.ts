import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Providers } from "@arkecosystem/core-kernel";

import { registerFormats } from "./formats";
import { registerKeywords } from "./keywords";
import { schemas } from "./schemas";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		await this.#registerFormats();

		await this.#registerKeywords();

		await this.#registerSchemas();
	}

	async #registerFormats(): Promise<void> {
		for (const format of Object.values(registerFormats(this.app.get(Identifiers.Cryptography.Configuration)))) {
			this.app.get<Contracts.Crypto.IValidator>(Identifiers.Cryptography.Validator).extend((ajv) => {
				format(ajv);
			});
		}
	}

	async #registerKeywords(): Promise<void> {
		for (const keywords of Object.values(registerKeywords(this.app.get(Identifiers.Cryptography.Configuration)))) {
			this.app.get<Contracts.Crypto.IValidator>(Identifiers.Cryptography.Validator).extend((ajv) => {
				keywords(ajv);
			});
		}
	}

	async #registerSchemas(): Promise<void> {
		for (const schema of Object.values(schemas)) {
			this.app.get<Contracts.Crypto.IValidator>(Identifiers.Cryptography.Validator).addSchema(schema);
		}
	}
}
