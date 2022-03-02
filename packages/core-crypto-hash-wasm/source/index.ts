import { Identifiers } from "@arkecosystem/core-contracts";
import { Providers } from "@arkecosystem/core-kernel";

import { HashFactory } from "./hash.factory";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		this.app.bind(Identifiers.Cryptography.HashFactory).to(HashFactory).inSingletonScope();
	}
}
