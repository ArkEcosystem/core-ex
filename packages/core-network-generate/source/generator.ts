import { Container } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Application } from "@arkecosystem/core-kernel";
import envPaths from "env-paths";
import { ensureDirSync, existsSync } from "fs-extra";
import { join } from "path";

import { makeApplication } from "./application-factory";
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

type Logger = { info: (message: string) => void };
export class NetworkGenerate {
	#app: Application;
	#logger?: Logger;

	public constructor(logger?: Logger) {
		this.#logger = logger;

		this.#app = new Application(new Container());
	}

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
			epoch: new Date(new Date().toISOString().slice(0, 11) + "00:00:00.000Z"),
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

		const paths = envPaths(internalOptions.token, { suffix: "core" });
		const configPath = internalOptions.configPath ? internalOptions.configPath : paths.config;

		const coreConfigDestination = join(configPath, internalOptions.network);

		this.#app = await makeApplication(coreConfigDestination);

		const mnemonicGenerator = this.#app.get<MnemonicGenerator>(InternalIdentifiers.Generator.Mnemonic);
		const walletGenerator = this.#app.get<WalletGenerator>(InternalIdentifiers.Generator.Wallet);

		const networkWriter = this.#app.get<NetworkWriter>(InternalIdentifiers.NetworkWriter);

		const genesisWalletMnemonic = mnemonicGenerator.generate();
		const validatorsMnemonics = mnemonicGenerator.generateMany(internalOptions.validators);

		const tasks: Task[] = [
			{
				task: async () => {
					if (!internalOptions.overwriteConfig && existsSync(coreConfigDestination)) {
						throw new Error(`${coreConfigDestination} already exists.`);
					}

					ensureDirSync(coreConfigDestination);
				},
				title: `Prepare directories.`,
			},
		];

		if (writeOptions.writeGenesisBlock) {
			tasks.push({
				task: async () => {
					networkWriter.writeGenesisWallet(await walletGenerator.generate(genesisWalletMnemonic));
				},
				title: "Persist genesis wallet to genesis-wallet.json in core config path.",
			});
		}

		if (writeOptions.writeCrypto) {
			tasks.push({
				task: async () => {
					const milestones = this.#app
						.get<MilestonesGenerator>(InternalIdentifiers.Generator.Milestones)
						.setInitial(internalOptions)
						.setReward(internalOptions.rewardHeight, internalOptions.rewardAmount as string) // TODO: fix type
						.generate();

					this.#app.get<Contracts.Crypto.IConfiguration>(Identifiers.Cryptography.Configuration).setConfig({
						// @ts-ignore
						genesisBlock: {},
						milestones,
						// @ts-ignore
						network: {},
					});

					const genesisBlock = await this.#app
						.get<GenesisBlockGenerator>(InternalIdentifiers.Generator.GenesisBlock)
						.generate(genesisWalletMnemonic, validatorsMnemonics, internalOptions);

					const network = this.#app
						.get<NetworkGenerator>(InternalIdentifiers.Generator.Network)
						.generate(genesisBlock.payloadHash, internalOptions);

					networkWriter.writeCrypto(genesisBlock, milestones, network);
				},
				title: "Persist genesis wallet to genesis-wallet.json in core config path.",
			});
		}

		if (writeOptions.writePeers) {
			tasks.push({
				task: async () => {
					networkWriter.writePeers(internalOptions.peers);
				},
				title: "Write peers.json",
			});
		}

		if (writeOptions.writeValidators) {
			tasks.push({
				task: async () => {
					networkWriter.writeValidators(validatorsMnemonics);
				},
				title: "Write validators.json",
			});
		}

		if (writeOptions.writeValidators) {
			tasks.push({
				task: async () => {
					networkWriter.writeEnvironment(
						this.#app
							.get<EnvironmentGenerator>(InternalIdentifiers.Generator.Environment)
							.addInitialRecords()
							.addRecords(this.#preparteEnvironmentOptions(internalOptions))
							.generate(),
					);
				},
				title: "Write .env",
			});
		}

		if (writeOptions.writeApp) {
			tasks.push({
				task: async () => {
					networkWriter.writeApp(
						this.#app.get<AppGenerator>(InternalIdentifiers.Generator.App).generateDefault(),
					);
				},
				title: "Write app.json",
			});
		}

		for (const task of tasks) {
			this.#logger?.info(task.title);
			await task.task();
		}

		this.#logger?.info(`Configuration generated on location: ${coreConfigDestination}`);
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
