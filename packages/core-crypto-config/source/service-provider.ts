import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Providers } from "@arkecosystem/core-kernel";

import { Configuration } from "./configuration";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		this.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();

		try {
			const config: Contracts.Crypto.NetworkConfigPartial = this.#fromConfigRepository();

			this.app.get<Contracts.Crypto.IConfiguration>(Identifiers.Cryptography.Configuration).setConfig(config);

			console.log(config.milestones);

			this.app.bind<Contracts.Crypto.NetworkConfigPartial>(Identifiers.Crypto).toConstantValue(config);
		} catch {
			// @TODO: this breaks during network config generation
		}
	}

	#fromConfigRepository(): Contracts.Crypto.NetworkConfigPartial {
		const configRepository: any = this.app.get(Identifiers.ConfigRepository);

		return {
			// @ts-ignore
			genesisBlock: configRepository.get<IBlockJson>("crypto.genesisBlock")!,
			// @ts-ignore
			milestones: configRepository.get<Array<Record<string, any>>>("crypto.milestones")!,
			// @ts-ignore
			network: configRepository.get<Network>("crypto.network")!,
		};
	}
}
