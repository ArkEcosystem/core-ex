import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Application } from "@arkecosystem/core-kernel";
import { ensureDirSync, existsSync } from "fs-extra";

import { EnviromentData } from "./contracts";
import {
	AppGenerator,
	EnvironmentGenerator,
	GenesisBlockGenerator,
	MilestonesGenerator,
	MnemonicGenerator,
	NetworkGenerator,
	WalletGenerator,
} from "./generators";
import { Identifiers as InternalIdentifiers } from "./identifiers";
import { NetworkWriter } from "./network-writer";

type Task = {
	task: () => Promise<void>;
	title: string;
};

@injectable()
export class ConfigurationGenerator {
	@inject(InternalIdentifiers.Application)
	private app: Application;

	@inject(InternalIdentifiers.NetworkWriter)
	private networkWriter: NetworkWriter;

	@inject(InternalIdentifiers.Generator.App)
	private appGenerator: AppGenerator;

	@inject(InternalIdentifiers.Generator.Environment)
	private environmentGenerator: EnvironmentGenerator;

	@inject(InternalIdentifiers.Generator.GenesisBlock)
	private genesisBlockGenerator: GenesisBlockGenerator;

	@inject(InternalIdentifiers.Generator.Milestones)
	private milestonesGenerator: MilestonesGenerator;

	@inject(InternalIdentifiers.Generator.Mnemonic)
	private mnemonicGenerator: MnemonicGenerator;

	@inject(InternalIdentifiers.Generator.Network)
	private networkGenerator: NetworkGenerator;

	@inject(InternalIdentifiers.Generator.Wallet)
	private walletGenerator: WalletGenerator;

	@inject(InternalIdentifiers.DataPath)
	private dataPath: string;

	public async generate(
		options: Contracts.NetworkGenerator.Options,
		writeOptions?: Contracts.NetworkGenerator.WriteOptions,
	): Promise<void> {
		const internalOptions: Contracts.NetworkGenerator.InternalOptions = {
			blockTime: 8,
			coreDBHost: "localhost",
			coreDBPort: 5432,
			coreP2PPort: 4000,
			coreWebhooksPort: 4004,
			distribute: false,
			epoch: new Date(),
			explorer: "",
			force: false,
			maxBlockPayload: 2_097_152,
			maxTxPerBlock: 150,
			network: "testnet",
			overwriteConfig: false,
			peers: ["127.0.0.1"],
			premine: "12500000000000000",
			pubKeyHash: 30,
			rewardAmount: "200000000",
			rewardHeight: 75_600,
			validators: 51,
			vendorFieldLength: 255,
			wif: 186,
			...options,
		};

		writeOptions = {
			writeApp: true,
			writeCrypto: true,
			writeEnvironment: true,
			writeGenesisBlock: true,
			writePeers: true,
			writeValidators: true,
			...writeOptions,
		};

		// const paths = envPaths(internalOptions.token, { suffix: "core" });
		// const configPath = internalOptions.configPath ? internalOptions.configPath : paths.config;

		// const coreConfigDestination = join(configPath, internalOptions.network);

		// this.app = await makeApplication(coreConfigDestination);

		const genesisWalletMnemonic = this.mnemonicGenerator.generate();
		const validatorsMnemonics = this.mnemonicGenerator.generateMany(internalOptions.validators);

		const tasks: Task[] = [
			{
				task: async () => {
					if (!internalOptions.overwriteConfig && existsSync(this.dataPath)) {
						throw new Error(`${this.dataPath} already exists.`);
					}

					ensureDirSync(this.dataPath);
				},
				title: `Preparing directories.`,
			},
		];

		if (writeOptions.writeGenesisBlock) {
			tasks.push({
				task: async () => {
					this.networkWriter.writeGenesisWallet(await this.walletGenerator.generate(genesisWalletMnemonic));
				},
				title: "Writing genesis-wallet.json in core config path.",
			});
		}

		if (writeOptions.writeCrypto) {
			tasks.push({
				task: async () => {
					const milestones = this.milestonesGenerator
						.setInitial(internalOptions)
						.setReward(internalOptions.rewardHeight, internalOptions.rewardAmount as string) // TODO: fix type
						.generate();

					this.app.get<Contracts.Crypto.IConfiguration>(Identifiers.Cryptography.Configuration).setConfig({
						// @ts-ignore
						genesisBlock: {},
						milestones,
						// @ts-ignore
						network: {},
					});

					const genesisBlock = await this.genesisBlockGenerator.generate(
						genesisWalletMnemonic,
						validatorsMnemonics,
						internalOptions,
					);

					const network = this.networkGenerator.generate(genesisBlock.payloadHash, internalOptions);

					this.networkWriter.writeCrypto(genesisBlock, milestones, network);
				},
				title: "Writing crypto.json in core config path.",
			});
		}

		if (writeOptions.writePeers) {
			tasks.push({
				task: async () => {
					this.networkWriter.writePeers(internalOptions.peers);
				},
				title: "Writing peers.json in core config path.",
			});
		}

		if (writeOptions.writeValidators) {
			tasks.push({
				task: async () => {
					this.networkWriter.writeValidators(validatorsMnemonics);
				},
				title: "Writing validators.json in core config path.",
			});
		}

		if (writeOptions.writeValidators) {
			tasks.push({
				task: async () => {
					this.networkWriter.writeEnvironment(
						this.environmentGenerator
							.addInitialRecords()
							.addRecords(this.#preparteEnvironmentOptions(internalOptions))
							.generate(),
					);
				},
				title: "Writing .env in core config path.",
			});
		}

		if (writeOptions.writeApp) {
			tasks.push({
				task: async () => {
					this.networkWriter.writeApp(this.appGenerator.generateDefault());
				},
				title: "Writing app.json in core config path.",
			});
		}

		let logger: Contracts.Kernel.Logger | undefined;
		if (this.app.isBound(InternalIdentifiers.LogService)) {
			logger = this.app.get<Contracts.Kernel.Logger>(InternalIdentifiers.LogService);
		}

		for (const task of tasks) {
			logger?.info(task.title);
			await task.task();
		}

		logger?.info(`Configuration generated on location: ${this.dataPath}`);
	}

	#preparteEnvironmentOptions(options: Contracts.NetworkGenerator.EnvironmentOptions): EnviromentData {
		const data: EnviromentData = {
			CORE_DB_HOST: options.coreDBHost,
			CORE_DB_PORT: options.coreDBPort,
			CORE_P2P_PORT: options.coreP2PPort,
			CORE_WEBHOOKS_PORT: options.coreWebhooksPort,
		};

		if (options.coreDBDatabase) {
			data.CORE_DB_DATABASE = options.coreDBDatabase;
		}

		if (options.coreDBUsername) {
			data.CORE_DB_USERNAME = options.coreDBUsername;
		}

		if (options.coreDBPassword) {
			data.CORE_DB_PASSWORD = options.coreDBDatabase;
		}

		return data;
	}
}
