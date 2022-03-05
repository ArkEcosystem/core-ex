import { Providers } from "@arkecosystem/core-kernel";
import prettyMs from "pretty-ms";

import { checkNTP } from "./checker";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		//
	}

	public async boot(): Promise<void> {
		try {
			const { host, time } = await checkNTP(this.app, options);

			this.logger.info(`Your NTP connectivity has been verified by ${host}`);

			this.logger.info(`Local clock is off by ${time.t < 0 ? "-" : ""}${prettyMs(Math.abs(time.t))} from NTP`);
		} catch (error) {
			this.logger.error(error.message);
		}
	}
}
