import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { BigNumber } from "@arkecosystem/utils";
import dayjs from "dayjs";

import secrets from "../../internal/passphrases.json";
import { Signer } from "../../internal/signer";
import { FactoryBuilder } from "../factory-builder";
import { generateApp } from "./generate-app";

export const registerBlockFactory = async (
	factory: FactoryBuilder,
	config: Contracts.Crypto.NetworkConfig,
): Promise<void> => {
	const app = await generateApp(config);

	factory.set("Block", async ({ options }) => {
		const previousBlock = options.getPreviousBlock
			? options.getPreviousBlock()
			: app.get<Contracts.Crypto.IConfiguration>(Identifiers.Cryptography.Configuration).get("genesisBlock");

		const { reward } = app
			.get<Contracts.Crypto.IConfiguration>(Identifiers.Cryptography.Configuration)
			.getMilestone(previousBlock.height);

		const transactions = options.transactions || [];
		if (options.transactionsCount) {
			const signer = new Signer(
				app.get<Contracts.Crypto.IConfiguration>(Identifiers.Cryptography.Configuration).all(),
				options.nonce,
			);
			const genesisWallets = previousBlock.transactions
				.map((transaction) => transaction.recipientId)
				.filter((address: string) => !!address);

			for (let index = 0; index < options.transactionsCount; index++) {
				transactions.push(
					signer.makeTransfer({
						amount: (options.amount || 2) + index,
						passphrase: secrets[0],
						recipient: genesisWallets[Math.floor(Math.random() * genesisWallets.length)],
						transferFee: options.fee || 0.1,
					}),
				);
			}
		}

		const totals: { amount: BigNumber; fee: BigNumber } = {
			amount: BigNumber.ZERO,
			fee: BigNumber.ZERO,
		};
		const payloadBuffers: Buffer[] = [];

		for (const transaction of transactions) {
			totals.amount = totals.amount.plus(transaction.amount);
			totals.fee = totals.fee.plus(transaction.fee);

			payloadBuffers.push(Buffer.from(transaction.id, "hex"));
		}

		const passphrase = options.passphrase || secrets[0];

		return app.get<Contracts.Crypto.IBlockFactory>(Identifiers.Cryptography.Block.Factory).make(
			{
				generatorPublicKey: await app
					.get<Contracts.Crypto.IPublicKeyFactory>(Identifiers.Cryptography.Identity.PublicKeyFactory)
					.fromMnemonic(passphrase),
				height: previousBlock.height + 1,
				numberOfTransactions: transactions.length,
				payloadHash: (
					await app
						.get<Contracts.Crypto.IHashFactory>(Identifiers.Cryptography.HashFactory)
						.sha256(payloadBuffers)
				).toString("hex"),
				payloadLength: 32 * transactions.length,
				previousBlock: previousBlock.id,
				reward: options.reward || reward,
				timestamp: options.timestamp || dayjs().unix(),
				totalAmount: totals.amount,
				totalFee: totals.fee,
				transactions,
				version: 1,
			},
			await app
				.get<Contracts.Crypto.IKeyPairFactory>(Identifiers.Cryptography.Identity.KeyPairFactory)
				.fromMnemonic(passphrase),
		);
	});
};
