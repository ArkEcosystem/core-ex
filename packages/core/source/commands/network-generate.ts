import { Commands, Container, Contracts, Services } from "@arkecosystem/core-cli";
import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts as BaseContracts, Identifiers } from "@arkecosystem/core-contracts";
import { NetworkGenerator } from "@arkecosystem/core-network-generate";
// import { ServiceProvider as CoreCryptoAddressBech32m } from "@arkecosystem/core-crypto-address-bech32m";
// import { ServiceProvider as CoreCryptoBlock } from "@arkecosystem/core-crypto-block";
// import { ServiceProvider as CoreCryptoConfig } from "@arkecosystem/core-crypto-config";
// import { ServiceProvider as CoreCryptoHashBcrypto } from "@arkecosystem/core-crypto-hash-bcrypto";
// import { ServiceProvider as CoreCryptoKeyPairSchnorr } from "@arkecosystem/core-crypto-key-pair-schnorr";
// import { ServiceProvider as CoreCryptoSignatureSchnorr } from "@arkecosystem/core-crypto-signature-schnorr";
// import { ServiceProvider as CoreCryptoTime } from "@arkecosystem/core-crypto-time";
// import { ServiceProvider as CoreCryptoTransaction } from "@arkecosystem/core-crypto-transaction";
// import { ServiceProvider as CoreCryptoTransactionMultiPayment } from "@arkecosystem/core-crypto-transaction-multi-payment";
// import { ServiceProvider as CoreCryptoTransactionMultiSignatureRegistration } from "@arkecosystem/core-crypto-transaction-multi-signature-registration";
// import {
// 	ServiceProvider as CoreCryptoTransactionTransfer,
// 	TransferBuilder,
// } from "@arkecosystem/core-crypto-transaction-transfer";
// import {
// 	ServiceProvider as CoreCryptoTransactionValidatorRegistration,
// 	ValidatorRegistrationBuilder,
// } from "@arkecosystem/core-crypto-transaction-validator-registration";
// import { ServiceProvider as CoreCryptoTransactionValidatorResignation } from "@arkecosystem/core-crypto-transaction-validator-resignation";
// import { ServiceProvider as CoreCryptoTransactionVote, VoteBuilder } from "@arkecosystem/core-crypto-transaction-vote";
// import { ServiceProvider as CoreCryptoValidation } from "@arkecosystem/core-crypto-validation";
// import { ServiceProvider as CoreCryptoWif } from "@arkecosystem/core-crypto-wif";
// import { ServiceProvider as CoreDatabase } from "@arkecosystem/core-database";
// import { ServiceProvider as CoreFees } from "@arkecosystem/core-fees";
// import { ServiceProvider as CoreFeesStatic } from "@arkecosystem/core-fees-static";
// import { ServiceProvider as CoreLMDB } from "@arkecosystem/core-lmdb";
// import { ServiceProvider as CoreSerializer } from "@arkecosystem/core-serializer";
// import { ServiceProvider as CoreValidation } from "@arkecosystem/core-validation";
import Joi from "joi";
import prompts from "prompts";

interface Flag {
	name: string;
	description: string;
	schema: Joi.Schema;
	promptType?: string;
	default?: any;
}

@injectable()
export class Command extends Commands.Command {
	@inject(Container.Identifiers.Logger)
	private readonly logger!: Services.Logger;

	public signature = "network:generate";

	public description = "Generates a new network configuration.";

	public requiresNetwork = false;

	/*eslint-disable */
	#flagSettings: Flag[] = [
		{
			name: "network",
			description: "The name of the network.",
			schema: Joi.string(),
			promptType: "text",
			default: "testnet",
		},
		{
			name: "premine",
			description: "The number of pre-mined tokens.",
			schema: Joi.alternatives().try(Joi.string(), Joi.number()),
			promptType: "text",
			default: "12500000000000000",
		},
		{
			name: "validators",
			description: "The number of validators to generate.",
			schema: Joi.number(),
			promptType: "number",
			default: 51,
		},
		{
			name: "blockTime",
			description: "The network blockTime.",
			schema: Joi.number(),
			promptType: "number",
			default: 8,
		},
		{
			name: "maxTxPerBlock",
			description: "The maximum number of transactions per block.",
			schema: Joi.number(),
			promptType: "number",
			default: 150,
		},
		{
			name: "maxBlockPayload",
			description: "The maximum payload length by block.",
			schema: Joi.number(),
			promptType: "number",
			default: 2097152,
		},
		{
			name: "rewardHeight",
			description: "The height at which validator block reward starts.",
			schema: Joi.number(),
			promptType: "number",
			default: 75600,
		},
		{
			name: "rewardAmount",
			description: "The number of the block reward per forged block.",
			schema: Joi.alternatives().try(Joi.string(), Joi.number()),
			promptType: "number",
			default: "200000000",
		},
		{
			name: "pubKeyHash",
			description: "The public key hash.",
			schema: Joi.number(),
			promptType: "number",
			default: 30,
		},
		{
			name: "wif",
			description: "The WIF (Wallet Import Format) that should be used.",
			schema: Joi.number(),
			promptType: "number",
			default: 186,
		},
		{
			name: "token",
			description: "The name that is attributed to the token on the network.",
			schema: Joi.string(),
			promptType: "text",
			default: "ARK",
		},
		{
			name: "symbol",
			description: "The character that is attributed to the token on the network.",
			schema: Joi.string(),
			promptType: "text",
			default: "TѦ",
		},
		{
			name: "explorer",
			description: "The URL that hosts the network explorer.",
			schema: Joi.string(),
			promptType: "text",
			default: "https://explorer.ark.io",
		},
		{
			name: "distribute",
			description: "Distribute the premine evenly between all validators?",
			schema: Joi.bool(),
			promptType: "confirm",
			default: false,
		},

		{
			name: "epoch",
			description: "Start time of the network.",
			schema: Joi.date(),
			default: new Date(Date.now()).toISOString().slice(0, 11) + "00:00:00.000Z",
		},
		{
			name: "vendorFieldLength",
			description: "The maximum length of transaction's vendor field",
			schema: Joi.number().min(0).max(255),
			default: 255,
		},

		// Env
		{ name: "coreDBHost", description: "Core database host.", schema: Joi.string(), default: "localhost" },
		{ name: "coreDBPort", description: "Core database port.", schema: Joi.number(), default: 5432 },
		{ name: "coreDBUsername", description: "Core database username.", schema: Joi.string() },
		{ name: "coreDBPassword", description: "Core database password.", schema: Joi.string() },
		{ name: "coreDBDatabase", description: "Core database database.", schema: Joi.string() },

		{ name: "coreP2PPort", description: "Core P2P port.", schema: Joi.number(), default: 4000 },
		{ name: "coreWebhooksPort", description: "Core Webhooks port.", schema: Joi.number(), default: 4004 },
		{ name: "coreMonitorPort", description: "Core Webhooks port.", schema: Joi.number(), default: 4005 },

		// Peers
		{
			name: "peers",
			description: "Peers IP addresses (and ports), separated with comma.",
			schema: Joi.string().allow(""),
			default: "127.0.0.1",
		},

		// General
		{ name: "configPath", description: "Configuration path.", schema: Joi.string() },
		{
			name: "overwriteConfig",
			description: "Overwrite existing configuration.",
			schema: Joi.boolean(),
			default: false,
		},
		{ name: "force", description: "Skip prompts and use given flags.", schema: Joi.boolean(), default: false },
	];
	/*eslint-enable */

	public configure(): void {
		for (const flag of this.#flagSettings) {
			const flagSchema: Joi.Schema = flag.schema;

			if (flag.default !== undefined) {
				flagSchema.default(flag.default);

				flag.description += ` (${flag.default.toString()})`;
			}

			this.definition.setFlag(flag.name, flag.description, flag.schema);
		}
	}

	public async execute(): Promise<void> {
		const flags: Contracts.AnyObject = this.getFlags();

		const allFlagsSet = !this.#flagSettings
			.filter((flag) => flag.promptType)
			.find((flag) => flags[flag.name] === undefined);

		const defaults = this.#flagSettings.reduce<any>((accumulator: any, flag: Flag) => {
			accumulator[flag.name] = flag.default;

			return accumulator;
		}, {});

		let options = {
			...defaults,
			...flags,
		};

		const networkGenerator = new NetworkGenerator();

		if (flags.force || allFlagsSet) {
			return networkGenerator.generate(this.#convertPeers(options) as any);
		}

		const response = await prompts(
			this.#flagSettings
				.filter((flag) => flag.promptType) // Show prompt only for flags with defined promptType
				.map(
					(flag) =>
						({
							initial: flags[flag.name] ? `${flags[flag.name]}` : flag.default || "undefined",
							message: flag.description,
							name: flag.name,
							type: flag.promptType,
						} as prompts.PromptObject<string>),
				)
				.concat({
					message: "Can you confirm?",
					name: "confirm",
					type: "confirm",
				} as prompts.PromptObject<string>),
		);

		options = {
			...defaults,
			...flags,
			...response,
		};

		if (!response.confirm) {
			throw new Error("You'll need to confirm the input to continue.");
		}

		for (const flag of this.#flagSettings.filter((flag) => flag.promptType)) {
			if (flag.promptType === "text" && options[flag.name] !== "undefined") {
				continue;
			}

			if (flag.promptType === "number" && !Number.isNaN(options[flag.name])) {
				continue;
			}

			if (["confirm", "date"].includes(flag.promptType)) {
				continue;
			}

			throw new Error(`Flag ${flag.name} is required.`);
		}

		await networkGenerator.generate(this.#convertPeers(options) as any);
	}

	#convertPeers(options: { peers: string }): { peers: string[] } {
		return {
			...options,
			peers: options.peers.replace(" ", "").split(","),
		};
	}
}
