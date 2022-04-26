import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { ServiceProvider as CryptoValidationServiceProvider } from "@arkecosystem/core-crypto-validation";
import { ServiceProvider as ValidationServiceProvider } from "@arkecosystem/core-validation";
import { BigNumber } from "@arkecosystem/utils";

import cryptoJson from "../../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../../core-test-framework";
import { ValidatorRegistrationTransaction } from "./1";

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
		asset: {
			validator: {
				username: "username",
			},
		},
		fee: 1,
		nonce: 0,
		senderPublicKey: "A".repeat(64),
		type: Contracts.Crypto.TransactionType.ValidatorRegistration,
	};

	it("#getSchema - should be valid", async ({ validator }) => {
		validator.addSchema(ValidatorRegistrationTransaction.getSchema());

		assert.undefined((await validator.validate("validatorRegistration", transactionOriginal)).error);
	});

	it("#getSchema - amount should be bigNumber, equal 0", async ({ validator }) => {
		validator.addSchema(ValidatorRegistrationTransaction.getSchema());

		const validValues = [0, "0", BigNumber.ZERO];
		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				amount: value,
			};

			assert.undefined((await validator.validate("validatorRegistration", transaction)).error);
		}

		const invalidValues = [-1, 1.1, 1, BigNumber.ONE, "test", null, {}];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				amount: value,
			};

			assert.true((await validator.validate("validatorRegistration", transaction)).error.includes("amount"));
		}
	});

	it("#getSchema - asset should be required object", async ({ validator }) => {
		validator.addSchema(ValidatorRegistrationTransaction.getSchema());

		const invalidValues = [1, BigNumber.ONE, "test", null, {}];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				asset: value,
			};

			assert.true((await validator.validate("validatorRegistration", transaction)).error.includes("asset"));
		}
	});

	it("#getSchema - asset.validator should be required object", async ({ validator }) => {
		validator.addSchema(ValidatorRegistrationTransaction.getSchema());

		const invalidValues = [1, BigNumber.ONE, "test", null, {}];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				asset: {
					validator: validator,
				},
			};

			assert.true((await validator.validate("validatorRegistration", transaction)).error.includes("validator"));
		}
	});

	it("#getSchema - usernae should be validatorUsername", async ({ validator }) => {
		validator.addSchema(ValidatorRegistrationTransaction.getSchema());

		const invalidValues = [1, BigNumber.ONE, "", "a".repeat(21), null, undefined, {}];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				asset: {
					validator: {
						username: value,
					},
				},
			};

			assert.true((await validator.validate("validatorRegistration", transaction)).error.includes("username"));
		}
	});

	it("#getSchema - fee should be bigNumber, min 1", async ({ validator }) => {
		validator.addSchema(ValidatorRegistrationTransaction.getSchema());

		const validValues = [1, 100, BigNumber.ONE];
		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				fee: value,
			};

			assert.undefined((await validator.validate("validatorRegistration", transaction)).error);
		}

		const invalidValues = [-1, 1.1, 0, BigNumber.ZERO, "test", null, undefined, {}];
		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				fee: value,
			};

			assert.true((await validator.validate("validatorRegistration", transaction)).error.includes("fee"));
		}
	});

	it("#getSchema - type should be validatorRegistration", async ({ validator }) => {
		validator.addSchema(ValidatorRegistrationTransaction.getSchema());

		const validValues = [Contracts.Crypto.TransactionType.ValidatorRegistration];
		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				type: value,
			};

			assert.undefined((await validator.validate("validatorRegistration", transaction)).error);
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

			assert.true((await validator.validate("validatorRegistration", transaction)).error.includes("type"));
		}
	});
});
