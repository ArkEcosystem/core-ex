import { Providers } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-contracts";

import { Validator } from "./validator";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		this.app.bind(Identifiers.Cryptography.Validator).to(Validator).inSingletonScope();
	}
}
