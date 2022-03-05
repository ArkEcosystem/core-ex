import { Providers } from "@arkecosystem/core-kernel";
import prettyMs from "pretty-ms";

import { checkDNS } from "./checker";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		//
	}

	public async boot(): Promise<void> {
		try {
			const host = await checkDNS(this.app, options);

			this.logger.info(`Your network connectivity has been verified by ${host}`);
		} catch (error) {
			this.logger.error(error.message);
		}
	}
}
