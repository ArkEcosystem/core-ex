import { Container } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Application } from "@arkecosystem/core-kernel";
import envPaths from "env-paths";
import { ensureDirSync, existsSync, writeFileSync } from "fs-extra";
import { join, resolve } from "path";

import { makeApplication } from "./application-factory";
import {
	AppGenerator,
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
export class NetworkGenerator2 {
	#app: Application;
	#logger?: Logger;

	public constructor(logger?: Logger) {
		this.#logger = logger;

		this.#app = new Application(new Container());
	}

	public async generate(options: Contracts.NetworkGenerator.Options): Promise<void> {
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
			{
				task: async () => {
					networkWriter.writeGenesisWallet(walletGenerator.generate(genesisWalletMnemonic));
				},
				title: "Persist genesis wallet to genesis-wallet.json in core config path.",
			},
			{
				task: async () => {
					// Milestones
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
				title: "Generate crypto network configuration.",
			},
			{
				task: async () => {
					networkWriter.writePeers(internalOptions.peers);

					networkWriter.writeValidators(validatorsMnemonics);

					writeFileSync(
						resolve(coreConfigDestination, ".env"),
						this.#generateEnvironmentVariables(internalOptions),
					);

					networkWriter.writeApp(
						this.#app.get<AppGenerator>(InternalIdentifiers.Generator.App).generateDefault(),
					);
				},
				title: "Generate Core network configuration.",
			},
		];

		for (const task of tasks) {
			this.#logger?.info(task.title);
			await task.task();
		}

		this.#logger?.info(`Configuration generated on location: ${coreConfigDestination}`);
	}

	#generateEnvironmentVariables(options: Contracts.NetworkGenerator.InternalOptions): string {
		let result = "";

		result += "CORE_LOG_LEVEL=info\n";
		result += "CORE_LOG_LEVEL_FILE=info\n\n";

		result += `CORE_DB_HOST=${options.coreDBHost}\n`;
		result += `CORE_DB_PORT=${options.coreDBPort}\n`;
		result += options.coreDBUsername ? `CORE_DB_USERNAME=${options.coreDBUsername}\n` : "";
		result += options.coreDBPassword ? `CORE_DB_PASSWORD=${options.coreDBPassword}\n` : "";
		result += options.coreDBDatabase ? `CORE_DB_DATABASE=${options.coreDBDatabase}\n\n` : "\n";

		result += "CORE_P2P_HOST=0.0.0.0\n";
		result += `CORE_P2P_PORT=${options.coreP2PPort}\n\n`;

		result += "CORE_WEBHOOKS_HOST=0.0.0.0\n";
		result += `CORE_WEBHOOKS_PORT=${options.coreWebhooksPort}\n\n`;

		return result;
	}
}
