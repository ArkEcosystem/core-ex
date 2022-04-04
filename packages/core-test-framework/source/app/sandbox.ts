import { Container, interfaces } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Application, Providers, Types } from "@arkecosystem/core-kernel";
import { NetworkGenerator } from "@arkecosystem/core-network-generate";
import { removeSync } from "fs-extra";
import { resolve } from "path";
import { dirSync, setGracefulCleanup } from "tmp";

import { SandboxCallback } from "./contracts";

export class Sandbox {
	public readonly app: Application;

	private readonly container: interfaces.Container;

	private path = dirSync().name;

	private networkOptions: Contracts.NetworkGenerator.Options = {
		blockTime: 8,
		configPath: resolve(`${this.path}/unitnet`),
		distribute: true,
		explorer: "http://uexplorer.ark.io",
		maxBlockPayload: 2_097_152,
		maxTxPerBlock: 150,
		network: "unitnet",
		premine: "15300000000000000",
		pubKeyHash: 23,
		rewardAmount: "200_000_000",
		rewardHeight: 75_600,
		symbol: "UѦ",
		token: "UARK",
		validators: 51,
		wif: 186,
	};

	public constructor() {
		setGracefulCleanup();

		this.container = new Container();

		this.app = new Application(this.container);
	}

	public withNetworkOptions(options: Contracts.NetworkGenerator.Options) {
		this.networkOptions = { ...this.networkOptions, ...options };

		return this;
	}

	public async boot(callback?: SandboxCallback): Promise<void> {
		const generator = new NetworkGenerator();

		await generator.generate(this.networkOptions);

		// Generate Configurations
		// this.paths = {
		// 	core: generateCoreConfig(this.options),
		// 	crypto: generateCryptoConfig(this.options),
		// };

		// // Configure Crypto
		// const genesisBlock = require(this.paths.crypto.crypto).genesisBlock;
		// const milestones = require(this.paths.crypto.crypto).milestones;
		// const network = require(this.paths.crypto.crypto).network;

		// this.configuration.setConfig({
		// 	genesisBlock,
		// 	milestones,
		// 	network,
		// });

		// this.app.get<Services.Config.ConfigRepository>(Identifiers.ConfigRepository).merge({
		// 	crypto: {
		// 		genesisBlock,
		// 		milestones,
		// 		network,
		// 	},
		// });

		// Configure Application
		process.env.CORE_PATH_CONFIG = this.path;

		if (callback) {
			callback({
				app: this.app,
				container: this.container,
			});

			this.snapshot();
		}
	}

	public async dispose(callback?: SandboxCallback): Promise<void> {
		try {
			await this.app.terminate();
		} catch {
			// We encountered a unexpected error.
		}

		removeSync(this.path);

		if (callback) {
			callback({ app: this.app, container: this.container });
		}
	}

	public snapshot(): void {
		this.container.snapshot();
	}

	public restore(): void {
		try {
			this.container.restore();
		} catch {
			// No snapshot available to restore.
		}
	}

	public async registerServiceProvider({
		name,
		path,
		klass,
	}: {
		name: string;
		path: string;
		klass: Types.Class<any>;
	}): Promise<this> {
		const serviceProvider: Providers.ServiceProvider = this.app.resolve<any>(klass);
		serviceProvider.setManifest(this.app.resolve(Providers.PluginManifest).discover(path));
		serviceProvider.setConfig(this.app.resolve(Providers.PluginConfiguration).discover(name, path));

		this.app
			.get<Providers.ServiceProviderRepository>(Identifiers.ServiceProviderRepository)
			.set(name, serviceProvider);

		await serviceProvider.register();

		return this;
	}
}
