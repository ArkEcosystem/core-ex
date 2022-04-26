import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { ServiceProvider as CryptoValidationServiceProvider } from "@arkecosystem/core-crypto-validation";
import { ServiceProvider as ValidationServiceProvider } from "@arkecosystem/core-validation";
import { BigNumber } from "@arkecosystem/utils";

import cryptoJson from "../../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../../core-test-framework";
import { ValidatorResignationTransaction } from "./1";

describe<{
	sandbox: Sandbox;
	validator: Contracts.Crypto.IValidator;
}>("Schemas", ({ it, beforeEach, assert }) => {
	beforeEach(async (context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoJson);

		await context.sandbox.app.resolve(ValidationServiceProvider).register();
		await context.sandbox.app.resolve(CryptoValidationServiceProvider).register();

		context.validator = context.sandbox.app.get<Contracts.Crypto.IValidator>(Identifiers.Cryptography.Validator);
	});

	const transactionOriginal = {
		amount: 0,
		fee: 1,
		nonce: 0,
		senderPublicKey: "A".repeat(64),
		type: Contracts.Crypto.TransactionType.ValidatorResignation,
	};

	it("#getSchema - should be valid", async ({ validator }) => {
		validator.addSchema(ValidatorResignationTransaction.getSchema());

		assert.undefined((await validator.validate("validatorResignation", transactionOriginal)).error);
	});

	it("#getSchema - amount should be bigNumber, equal 0", async ({ validator }) => {
		validator.addSchema(ValidatorResignationTransaction.getSchema());

		const validValues = [0, "0", BigNumber.ZERO];
		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				amount: value,
			};

			assert.undefined((await validator.validate("validatorResignation", transaction)).error);
		}

		const invalidValues = [-1, 1.1, 1, BigNumber.ONE, "test", null, {}];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				amount: value,
			};

			assert.true((await validator.validate("validatorResignation", transaction)).error.includes("amount"));
		}
	});

	it("#getSchema - fee should be bigNumber, min 1", async ({ validator }) => {
		validator.addSchema(ValidatorResignationTransaction.getSchema());

		const validValues = [1, 100, BigNumber.ONE];
		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				fee: value,
			};

			assert.undefined((await validator.validate("validatorResignation", transaction)).error);
		}

		const invalidValues = [-1, 1.1, 0, BigNumber.ZERO, "test", null, undefined, {}];
		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				fee: value,
			};

			assert.true((await validator.validate("validatorResignation", transaction)).error.includes("fee"));
		}
	});

	it("#getSchema - type should be validatorResignation", async ({ validator }) => {
		validator.addSchema(ValidatorResignationTransaction.getSchema());

		const validValues = [Contracts.Crypto.TransactionType.ValidatorResignation];
		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				type: value,
			};

			assert.undefined((await validator.validate("validatorResignation", transaction)).error);
		}

		const invalidValues = [
			-1,
			1.1,
			Contracts.Crypto.TransactionType.Vote,
			BigNumber.ZERO,
			"test",
			null,
			undefined,
			{},
		];
		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				type: value,
			};

			assert.true((await validator.validate("validatorResignation", transaction)).error.includes("type"));
		}
	});
});
