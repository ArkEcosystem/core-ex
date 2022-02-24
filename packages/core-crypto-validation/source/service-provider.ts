import { Providers } from "@arkecosystem/core-kernel";
import { BINDINGS, IValidator } from "@packages/core-crypto-contracts/distribution";

import { registerFormats } from "./formats";
import { registerKeywords } from "./keywords";
import { schemas } from "./schemas";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		const validator: IValidator = this.app.get(BINDINGS.Validator);

		await this.registerFormats(validator);

		await this.registerKeywords(validator);

		await this.registerSchemas(validator);
	}

	private async registerFormats(validator: IValidator): Promise<void> {
		for (const [name, format] of Object.entries(registerFormats(this.app.get(BINDINGS.Configuration)))) {
			// @ts-ignore
			validator.addFormat(name, format);
		}
	}

	private async registerKeywords(validator: IValidator): Promise<void> {
		for (const [name, format] of Object.entries(registerKeywords(this.app.get(BINDINGS.Configuration)))) {
			// @ts-ignore
			validator.addFormat(name, format);
		}
	}

	private async registerSchemas(validator: IValidator): Promise<void> {
		for (const schema of Object.values(schemas)) {
			validator.addSchema(schema);
		}
	}
}
