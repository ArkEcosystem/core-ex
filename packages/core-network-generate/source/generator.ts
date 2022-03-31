// @ts-nocheck
import { Container } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { ServiceProvider as CoreCryptoAddressBech32m } from "@arkecosystem/core-crypto-address-bech32m";
import { ServiceProvider as CoreCryptoBlock } from "@arkecosystem/core-crypto-block";
import { ServiceProvider as CoreCryptoConfig } from "@arkecosystem/core-crypto-config";
import { ServiceProvider as CoreCryptoHashBcrypto } from "@arkecosystem/core-crypto-hash-bcrypto";
import { ServiceProvider as CoreCryptoKeyPairSchnorr } from "@arkecosystem/core-crypto-key-pair-schnorr";
import { ServiceProvider as CoreCryptoSignatureSchnorr } from "@arkecosystem/core-crypto-signature-schnorr";
import { ServiceProvider as CoreCryptoTime } from "@arkecosystem/core-crypto-time";
import { ServiceProvider as CoreCryptoTransaction } from "@arkecosystem/core-crypto-transaction";
import { ServiceProvider as CoreCryptoTransactionMultiPayment } from "@arkecosystem/core-crypto-transaction-multi-payment";
import { ServiceProvider as CoreCryptoTransactionMultiSignatureRegistration } from "@arkecosystem/core-crypto-transaction-multi-signature-registration";
import {
	ServiceProvider as CoreCryptoTransactionTransfer,
	TransferBuilder,
} from "@arkecosystem/core-crypto-transaction-transfer";
import {
	ServiceProvider as CoreCryptoTransactionValidatorRegistration,
	ValidatorRegistrationBuilder,
} from "@arkecosystem/core-crypto-transaction-validator-registration";
import { ServiceProvider as CoreCryptoTransactionValidatorResignation } from "@arkecosystem/core-crypto-transaction-validator-resignation";
import { ServiceProvider as CoreCryptoTransactionVote, VoteBuilder } from "@arkecosystem/core-crypto-transaction-vote";
import { ServiceProvider as CoreCryptoValidation } from "@arkecosystem/core-crypto-validation";
import { ServiceProvider as CoreCryptoWif } from "@arkecosystem/core-crypto-wif";
import { ServiceProvider as CoreDatabase } from "@arkecosystem/core-database";
import { ServiceProvider as CoreFees } from "@arkecosystem/core-fees";
import { ServiceProvider as CoreFeesStatic } from "@arkecosystem/core-fees-static";
import { Application } from "@arkecosystem/core-kernel";
import { ServiceProvider as CoreLMDB } from "@arkecosystem/core-lmdb";
import { ServiceProvider as CoreSerializer } from "@arkecosystem/core-serializer";
import { ServiceProvider as CoreValidation } from "@arkecosystem/core-validation";
import { BigNumber } from "@arkecosystem/utils";
import { generateMnemonic } from "bip39";
import dayjs from "dayjs";
import envPaths from "env-paths";
import { ensureDirSync, existsSync, readJSONSync, writeFileSync, writeJSONSync } from "fs-extra";
import { join, resolve } from "path";

import { Options } from "./contracts";

interface Wallet {
	address: string;
	passphrase: string;
	keys: Contracts.Crypto.IKeyPair;
	username: string | undefined;
}

interface Task {
	task: () => Promise<void>;
	title: string;
}

export class NetworkGenerator {
	#app: Application;

	public constructor() {
		this.#app = new Application(new Container());
	}

	public async generateNetwork(options: Options): Promise<void> {
		await this.#initialize(options);

		this.#app
			.get<Contracts.Crypto.IConfiguration>(Identifiers.Cryptography.Configuration)
			// @ts-ignore
			.setConfig({
				milestones: [{ address: { bech32m: "ark" } }],
			});

		const paths = envPaths(options.token, { suffix: "core" });
		const configPath = options.configPath ? options.configPath : paths.config;

		const coreConfigDestination = join(configPath, options.network);

		const validators: any[] = await this.#generateCoreValidators(options.validators, options.pubKeyHash);

		const genesisWallet = await this.#createWallet();

		const tasks: Task[] = [
			{
				task: async () => {
					if (!options.overwriteConfig && existsSync(coreConfigDestination)) {
						throw new Error(`${coreConfigDestination} already exists.`);
					}

					ensureDirSync(coreConfigDestination);

					console.log("Task 1");
				},
				title: `Prepare directories.`,
			},
			{
				task: async () => {
					writeJSONSync(resolve(coreConfigDestination, "genesis-wallet.json"), genesisWallet, {
						spaces: 4,
					});

					console.log("Task 2");
				},
				title: "Persist genesis wallet to genesis-wallet.json in core config path.",
			},
			{
				task: async () => {
					// Milestones
					const milestones = this.#generateCryptoMilestones(options);

					this.#app.get<Contracts.Crypto.IConfiguration>(Identifiers.Cryptography.Configuration).setConfig({
						// @ts-ignore
						genesisBlock: {},
						milestones,
						// @ts-ignore
						network: {},
					});

					// Genesis Block
					const genesisBlock = await this.#generateCryptoGenesisBlock(genesisWallet, validators, options);

					writeJSONSync(
						resolve(coreConfigDestination, "crypto.json"),
						{
							genesisBlock,
							milestones,
							network: this.#generateCryptoNetwork(genesisBlock.payloadHash, options),
						},
						{
							spaces: 4,
						},
					);

					console.log("Task 3");
				},
				title: "Generate crypto network configuration.",
			},
			{
				task: async () => {
					writeJSONSync(resolve(coreConfigDestination, "peers.json"), this.#generatePeers(options), {
						spaces: 4,
					});

					writeJSONSync(
						resolve(coreConfigDestination, "validators.json"),
						{ secrets: validators.map((d) => d.passphrase) },
						{ spaces: 4 },
					);

					writeFileSync(resolve(coreConfigDestination, ".env"), this.#generateEnvironmentVariables(options));

					writeJSONSync(resolve(coreConfigDestination, "app.json"), this.#generateApp(options), {
						spaces: 4,
					});

					console.log("Task 4");
				},
				title: "Generate Core network configuration.",
			},
		];

		for (const task of tasks) {
			await task.task();
		}

		// this.logger.info(`Configuration generated on location: ${coreConfigDestination}`);
	}

	async #initialize(options: Options): Promise<void> {
		this.#app.bind(Identifiers.LogService).toConstantValue({});

		const paths = envPaths(options.token, { suffix: "core" });
		for (const [type, path] of Object.entries(paths)) {
			this.#app.bind(`path.${type}`).toConstantValue(path);
		}

		await this.#app.resolve(CoreSerializer).register();
		await this.#app.resolve(CoreValidation).register();
		await this.#app.resolve(CoreCryptoConfig).register();
		await this.#app.resolve(CoreCryptoTime).register();
		await this.#app.resolve(CoreCryptoValidation).register();
		await this.#app.resolve(CoreCryptoHashBcrypto).register();
		await this.#app.resolve(CoreCryptoSignatureSchnorr).register();
		await this.#app.resolve(CoreCryptoKeyPairSchnorr).register();
		await this.#app.resolve(CoreCryptoAddressBech32m).register();
		await this.#app.resolve(CoreCryptoWif).register();
		await this.#app.resolve(CoreCryptoBlock).register();
		// await this.#app.resolve(CoreLMDB).register();
		// await this.#app.resolve(CoreDatabase).register();
		await this.#app.resolve(CoreFees).register();
		await this.#app.resolve(CoreFeesStatic).register();
		await this.#app.resolve(CoreCryptoTransaction).register();
		await this.#app.resolve(CoreCryptoTransactionValidatorRegistration).register();
		await this.#app.resolve(CoreCryptoTransactionValidatorResignation).register();
		await this.#app.resolve(CoreCryptoTransactionMultiPayment).register();
		await this.#app.resolve(CoreCryptoTransactionMultiSignatureRegistration).register();
		await this.#app.resolve(CoreCryptoTransactionTransfer).register();
		await this.#app.resolve(CoreCryptoTransactionVote).register();
	}

	#generateCryptoNetwork(nethash: string, options: Options) {
		return {
			client: {
				explorer: options.explorer,
				symbol: options.symbol,
				token: options.token,
			},
			messagePrefix: `${options.network} message:\n`,
			name: options.network,
			nethash,
			pubKeyHash: options.pubKeyHash,
			slip44: 1,
			wif: options.wif,
		};
	}

	#generateCryptoMilestones(options: Options) {
		return [
			{
				activeValidators: options.validators,
				address: {
					bech32m: "ark",
				},
				block: {
					maxPayload: options.maxBlockPayload,
					maxTransactions: options.maxTxPerBlock,
					version: 1,
				},
				blockTime: options.blockTime,
				epoch: new Date(options.epoch).toISOString(),
				height: 1,
				multiPaymentLimit: 256,
				reward: "0",
				satoshi: {
					decimals: 8,
					denomination: 1e8,
				},
				vendorFieldLength: options.vendorFieldLength,
			},
			{
				height: options.rewardHeight,
				reward: options.rewardAmount,
			},
		];
	}

	async #generateCryptoGenesisBlock(
		genesisWallet,
		validators,
		options: Options,
	): Promise<Contracts.Crypto.IBlockData> {
		const premineWallet: Wallet = await this.#createWallet();

		let transactions = [];

		if (options.distribute) {
			transactions = transactions.concat(
				...(await this.#createTransferTransactions(
					premineWallet,
					validators,
					options.premine,
					options.pubKeyHash,
				)),
			);
		} else {
			transactions = transactions.concat(
				await this.#createTransferTransaction(
					premineWallet,
					genesisWallet,
					options.premine,
					options.pubKeyHash,
				),
			);
		}

		transactions = transactions.concat(
			...(await this.#buildValidatorTransactions(validators, options.pubKeyHash)),
			...(await this.#buildVoteTransactions(validators, options.pubKeyHash)),
		);

		return this.#createGenesisBlock(premineWallet.keys, transactions, options);
	}

	#generateEnvironmentVariables(options: Options): string {
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

		result += "CORE_MANAGER_HOST=0.0.0.0\n";
		result += `CORE_MANAGER_PORT=${options.coreMonitorPort}\n\n`;

		return result;
	}

	#generatePeers(options: Options): { list: { ip: string; port: number }[] } {
		if (options.peers === "") {
			return { list: [] };
		}

		const list = options.peers
			.replace(" ", "")
			.split(",")
			.map((peer) => {
				const [ip, port] = peer.split(":");

				return {
					ip,
					port: Number.isNaN(Number.parseInt(port)) ? options.coreP2PPort : Number.parseInt(port),
				};
			});

		return { list };
	}

	#generateApp(options: Options): any {
		return readJSONSync(resolve(__dirname, "../../core/bin/config/testnet/app.json"));
	}

	async #generateCoreValidators(activeValidators: number, pubKeyHash: number): Promise<Wallet[]> {
		const wallets: Wallet[] = [];

		for (let index = 0; index < activeValidators; index++) {
			const validatorWallet: Wallet = await this.#createWallet();
			validatorWallet.username = `genesis_${index + 1}`;

			wallets.push(validatorWallet);
		}

		return wallets;
	}

	async #createWallet(): Promise<Wallet> {
		const passphrase = generateMnemonic(256);

		const keys: Contracts.Crypto.IKeyPair = await this.#app
			.get<Contracts.Crypto.IKeyPairFactory>(Identifiers.Cryptography.Identity.KeyPairFactory)
			.fromMnemonic(passphrase);

		return {
			address: await this.#app
				.get<Contracts.Crypto.IAddressFactory>(Identifiers.Cryptography.Identity.AddressFactory)
				.fromPublicKey(keys.publicKey),
			keys,
			passphrase,
			username: undefined,
		};
	}

	async #createTransferTransaction(sender: Wallet, recipient: Wallet, amount: string, pubKeyHash: number, nonce = 1) {
		return this.#formatGenesisTransaction(
			(
				await this.#app
					.resolve(TransferBuilder)
					.network(pubKeyHash)
					.fee("10000000")
					.nonce(nonce.toFixed(0))
					.recipientId(recipient.address)
					.amount(amount)
					.sign(sender.passphrase)
			).data,
			sender,
		);
	}

	async #createTransferTransactions(sender: Wallet, recipients: Wallet[], totalPremine: string, pubKeyHash: number) {
		const amount: string = BigNumber.make(totalPremine).dividedBy(recipients.length).toString();

		const result = [];

		for (const [index, recipient] of recipients.entries()) {
			result.push(await this.#createTransferTransaction(sender, recipient, amount, pubKeyHash, index + 1));
		}

		return result;
	}

	async #buildValidatorTransactions(senders: Wallet[], pubKeyHash: number) {
		const result = [];

		for (const [index, sender] of senders.entries()) {
			result[index] = await this.#formatGenesisTransaction(
				(
					await this.#app
						.resolve(ValidatorRegistrationBuilder)
						.network(pubKeyHash)
						.fee("2500000000")
						.nonce("1") // validator registration tx is always the first one from sender
						.usernameAsset(sender.username)
						.fee(`${25 * 1e8}`)
						.sign(sender.passphrase)
				).data,
				sender,
			);
		}

		return result;
	}

	async #buildVoteTransactions(senders: Wallet[], pubKeyHash: number) {
		const result = [];

		for (const [index, sender] of senders.entries()) {
			result[index] = await this.#formatGenesisTransaction(
				(
					await this.#app
						.resolve(VoteBuilder)
						.network(pubKeyHash)
						.fee("100000000")
						.nonce("2") // vote transaction is always the 2nd tx from sender (1st one is validator registration)
						.votesAsset([sender.keys.publicKey])
						.fee(`${1 * 1e8}`)
						.sign(sender.passphrase)
				).data,
				sender,
			);
		}

		return result;
	}

	async #formatGenesisTransaction(transaction, wallet: Wallet) {
		Object.assign(transaction, {
			fee: BigNumber.ZERO,
			timestamp: 0,
		});
		transaction.signature = await this.#app
			.get<Contracts.Crypto.ITransactionSigner>(Identifiers.Cryptography.Transaction.Signer)
			.sign(transaction, wallet.keys);
		transaction.id = await this.#app
			.get<Contracts.Crypto.ITransactionUtils>(Identifiers.Cryptography.Transaction.Utils)
			.getId(transaction);

		return transaction;
	}

	async #createGenesisBlock(
		keys: Contracts.Crypto.IKeyPair,
		transactions,
		options: Options,
	): Promise<Contracts.Crypto.IBlockData> {
		const totals: { amount: BigNumber; fee: BigNumber } = {
			amount: BigNumber.ZERO,
			fee: BigNumber.ZERO,
		};

		const payloadBuffers: Buffer[] = [];

		const sortedTransactions = transactions.sort((a, b) => {
			if (a.type === b.type) {
				return a.amount - b.amount;
			}

			return a.type - b.type;
		});

		for (const transaction of sortedTransactions) {
			totals.amount = totals.amount.plus(transaction.amount);
			totals.fee = totals.fee.plus(transaction.fee);

			payloadBuffers.push(Buffer.from(transaction.id, "hex"));
		}

		return {
			...(
				await this.#app.get<Contracts.Crypto.IBlockFactory>(Identifiers.Cryptography.Block.Factory).make(
					{
						generatorPublicKey: keys.publicKey,
						height: 1,
						numberOfTransactions: transactions.length,
						payloadHash: (
							await this.#app
								.get<Contracts.Crypto.IHashFactory>(Identifiers.Cryptography.HashFactory)
								.sha256(payloadBuffers)
						).toString("hex"),
						payloadLength: 32 * transactions.length,
						previousBlock: "0000000000000000000000000000000000000000000000000000000000000000",
						reward: "0",
						timestamp: dayjs(options.epoch).unix(),
						totalAmount: totals.amount.toString(),
						totalFee: totals.fee.toString(),
						transactions,
						version: 1,
					},
					keys,
				)
			).data,
			transactions,
		};
	}
}
