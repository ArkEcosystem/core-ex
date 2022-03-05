import { Providers } from "@arkecosystem/core-kernel";

import { Checker } from "./checker";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		//
	}

	public async boot(): Promise<void> {
		await this.app.resolve(Checker).execute();
	}
}
