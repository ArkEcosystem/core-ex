import { Kernel } from "@arkecosystem/core-contracts";
import { injectable } from "../../../ioc";

@injectable()
export class Pm2ProcessActionsService implements Kernel.ProcessActionsService {
	private readonly pmx;

	public constructor() {
		this.pmx = require("@pm2/io");
	}

	public register(remoteAction: Kernel.ProcessAction): void {
		this.pmx.action(remoteAction.name, (reply) => {
			remoteAction
				.handler()
				.then((response) => {
					reply({ response: response });
				})
				.catch((err) => {
					reply({ error: err.stack });
				});
		});
	}
}
