import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { MultiPaymentBuilder } from "@arkecosystem/core-crypto-transaction-multi-payment";
import { MultiSignatureBuilder } from "@arkecosystem/core-crypto-transaction-multi-signature-registration";
import { TransferBuilder } from "@arkecosystem/core-crypto-transaction-transfer";
import { ValidatorRegistrationBuilder } from "@arkecosystem/core-crypto-transaction-validator-registration";
import { ValidatorResignationBuilder } from "@arkecosystem/core-crypto-transaction-validator-resignation";
import { VoteBuilder } from "@arkecosystem/core-crypto-transaction-vote";
import { BigNumber } from "@arkecosystem/utils";

import secrets from "../../internal/passphrases.json";
import { FactoryBuilder } from "../factory-builder";
import { FactoryFunctionOptions } from "../types";

const AMOUNT = 1;
const FEE = 1;

const sign = ({ entity, options }: FactoryFunctionOptions) => entity.sign(options.passphrase || secrets[0]);

const multiSign = async ({ entity, options }: FactoryFunctionOptions) => {
	const passphrases: string[] = options.passphrases || [secrets[0], secrets[1], secrets[2]];

	for (const [index, passphrase] of passphrases.entries()) {
		await entity.multiSign(passphrase, index);
	}

	return entity;
};

// @ts-ignore
const applyModifiers = (entity, options) => {
	if (options.version) {
		entity.version(options.version);
	}

	if (entity.data.version > 1 && options.nonce) {
		entity.nonce(options.nonce);
	}

	if (options.timestamp) {
		entity.data.timestamp = options.timestamp;
	}

	if (options.senderPublicKey) {
		entity.senderPublicKey(options.senderPublicKey);
	}

	if (options.expiration) {
		entity.expiration(options.expiration);
	}

	return entity;
};

export const registerTransferFactory = (factory: FactoryBuilder, app: Contracts.Kernel.Application): void => {
	factory.set("Transfer", async ({ options }) => {
		const transferBuilder = app.resolve(TransferBuilder);

		return transferBuilder
			.amount(BigNumber.make(options.amount || AMOUNT).toFixed())
			.fee(BigNumber.make(options.fee || FEE).toFixed())
			.recipientId(
				options.recipientId ||
					(await app
						.get<Contracts.Crypto.IAddressFactory>(Identifiers.Cryptography.Identity.AddressFactory)
						.fromMnemonic(secrets[0])),
			);

		// return applyModifiers(
		// 	transferBuilder
		// 		.amount(BigNumber.make(options.amount || 1).toFixed())
		// 		.recipientId(options.recipientId || app.get<Contracts.Crypto.IAddressFactory>(Identifiers.Cryptography.Identity.AddressFactory).fromMnemonic(secrets[0]))
		// 	// Transactions.BuilderFactory.transfer()
		// 	// 	.amount(BigNumber.make(options.amount || 1).toFixed())
		// 	// 	.recipientId(options.recipientId || this.addressFactory.fromMnemonic(secrets[0])),
		// 	options,
		// );
	});

	factory
		.get("Transfer")
		.state("vendorField", ({ entity, options }) => entity.vendorField(options.vendorField || "Hello World"));

	factory.get("Transfer").state("sign", sign);
	factory.get("Transfer").state("multiSign", multiSign);
};

export const registerValidatorRegistrationFactory = (
	factory: FactoryBuilder,
	app: Contracts.Kernel.Application,
): void => {
	factory.set("ValidatorRegistration", async ({ options }) =>
		app
			.resolve(ValidatorRegistrationBuilder)
			.fee(BigNumber.make(options.fee || FEE).toFixed())
			.usernameAsset(options.username || Math.random().toString(36).slice(8)),
	);

	factory.get("ValidatorRegistration").state("sign", sign);
};

export const registerValidatorResignationFactory = (
	factory: FactoryBuilder,
	app: Contracts.Kernel.Application,
): void => {
	factory.set("ValidatorResignation", async ({ options }) =>
		app.resolve(ValidatorResignationBuilder).fee(BigNumber.make(options.fee || 1).toFixed()),
	);
	factory.get("ValidatorResignation").state("sign", sign);
};

export const registerVoteFactory = (factory: FactoryBuilder, app: Contracts.Kernel.Application): void => {
	factory.set(
		"Vote",
		async ({ options }) =>
			app
				.resolve(VoteBuilder)
				.fee(BigNumber.make(options.fee || FEE).toFixed())
				.votesAsset([
					options.publicKey ||
						(await app
							.get<Contracts.Crypto.IPublicKeyFactory>(Identifiers.Cryptography.Identity.PublicKeyFactory)
							.fromMnemonic(secrets[1])),
				]),
		// applyModifiers(
		// 	Transactions.BuilderFactory.vote().votesAsset([
		// 		`+${options.publicKey || this.publicKeyFactory.fromMnemonic(secrets[1])}`,
		// 	]),
		// 	options,
		// ),
	);

	factory.get("Vote").state("sign", sign);
	factory.get("Vote").state("multiSign", multiSign);
};

export const registerUnvoteFactory = (factory: FactoryBuilder, app: Contracts.Kernel.Application): void => {
	factory.set(
		"Unvote",
		async ({ options }) =>
			app
				.resolve(VoteBuilder)
				.fee(BigNumber.make(options.fee || FEE).toFixed())
				.unvotesAsset([
					options.publicKey ||
						(await app
							.get<Contracts.Crypto.IPublicKeyFactory>(Identifiers.Cryptography.Identity.PublicKeyFactory)
							.fromMnemonic(secrets[1])),
				]),
		// applyModifiers(
		// 	Transactions.BuilderFactory.vote().votesAsset([
		// 		`-${options.publicKey || this.publicKeyFactory.fromMnemonic(secrets[1])}`,
		// 	]),
		// 	options,
		// ),
	);

	factory.get("Unvote").state("sign", sign);
	factory.get("Unvote").state("multiSign", multiSign);
};

export const registerMultiSignature = (factory: FactoryBuilder, app: Contracts.Kernel.Application): void => {
	factory.set("MultiSignature", async ({ options }) => {
		// const builder = applyModifiers(Transactions.BuilderFactory.multiSignature(), options);

		const publicKeyFactory = app.get<Contracts.Crypto.IPublicKeyFactory>(
			Identifiers.Cryptography.Identity.PublicKeyFactory,
		);

		const publicKeys: string[] = options.publicKeys || [
			await publicKeyFactory.fromMnemonic(secrets[0]),
			await publicKeyFactory.fromMnemonic(secrets[1]),
			await publicKeyFactory.fromMnemonic(secrets[2]),
		];

		return app
			.resolve(MultiSignatureBuilder)
			.multiSignatureAsset({
				min: options.min || 2,
				publicKeys,
			})
			.senderPublicKey(publicKeys[0]);
	});

	factory.get("MultiSignature").state("sign", sign);
	factory.get("MultiSignature").state("multiSign", multiSign);
};

export const registerMultiPaymentFactory = (factory: FactoryBuilder, app: Contracts.Kernel.Application) => {
	factory.set(
		"MultiPayment",
		async ({ options }) =>
			app
				.resolve(MultiPaymentBuilder)
				.fee(BigNumber.make(options.fee || FEE).toFixed())
				.addPayment(
					options.recipientId ||
						(await app
							.get<Contracts.Crypto.IAddressFactory>(Identifiers.Cryptography.Identity.AddressFactory)
							.fromMnemonic(secrets[0])),
					BigNumber.make(options.amount || AMOUNT).toFixed(),
				),
		// applyModifiers(
		// 	new MultiPaymentBuilder().addPayment(
		// 		options.recipientId || (await this.addressFactory.fromMnemonic(secrets[0])),
		// 		BigNumber.make(options.amount || 1).toFixed(),
		// 	),
		// 	options,
		// ),
	);

	factory.get("MultiPayment").state("sign", sign);
	factory.get("MultiPayment").state("multiSign", multiSign);
};

export const registerTransactionFactory = (factory: FactoryBuilder, app: Contracts.Kernel.Application): void => {
	registerTransferFactory(factory, app);
	registerValidatorRegistrationFactory(factory, app);
	registerValidatorResignationFactory(factory, app);
	registerVoteFactory(factory, app);
	registerUnvoteFactory(factory, app);
	registerMultiSignature(factory, app);
	registerMultiPaymentFactory(factory, app);
};
