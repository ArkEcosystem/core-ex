import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { ServiceProvider as CryptoValidationServiceProvider } from "@arkecosystem/core-crypto-validation";
import { ServiceProvider as ValidationServiceProvider } from "@arkecosystem/core-validation";
import { BigNumber, ByteBuffer } from "@arkecosystem/utils";

import cryptoJson from "../../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../../core-test-framework";
import { VoteTransaction } from "./index";

describe<{
	sandbox: Sandbox;
}>("VoteTransactionV1", ({ beforeEach, it, assert }) => {
	const PUBLIC_KEY_SIZE = 33;

	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Identity.AddressFactory).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Size.PublicKey).toConstantValue(PUBLIC_KEY_SIZE);
	});

	it("shoudl serialize and deserialize transaction", async ({ sandbox }) => {
		const datas: Partial<Contracts.Crypto.ITransactionData>[] = [
			{
				asset: {
					unvotes: [],
					votes: ["aa".repeat(PUBLIC_KEY_SIZE)],
				},
			},
			{
				asset: {
					unvotes: [],
					votes: ["aa".repeat(PUBLIC_KEY_SIZE), "bb".repeat(PUBLIC_KEY_SIZE)],
				},
			},
			{
				asset: {
					unvotes: ["aa".repeat(PUBLIC_KEY_SIZE)],
					votes: [],
				},
			},
			{
				asset: {
					unvotes: ["aa".repeat(PUBLIC_KEY_SIZE), "bb".repeat(PUBLIC_KEY_SIZE)],
					votes: [],
				},
			},
			{
				asset: {
					unvotes: ["aa".repeat(PUBLIC_KEY_SIZE)],
					votes: ["bb".repeat(PUBLIC_KEY_SIZE)],
				},
			},
			{
				asset: {
					unvotes: ["aa".repeat(PUBLIC_KEY_SIZE), "bb".repeat(PUBLIC_KEY_SIZE)],
					votes: ["cc".repeat(PUBLIC_KEY_SIZE), "dd".repeat(PUBLIC_KEY_SIZE)],
				},
			},
		];

		for (const data of datas) {
			const transaction = sandbox.app.resolve(VoteTransaction);
			transaction.data = data as Contracts.Crypto.ITransactionData;

			const serialized = await transaction.serialize();

			assert.instance(serialized, ByteBuffer);

			transaction.data = {} as Contracts.Crypto.ITransactionData;
			serialized.reset();

			await transaction.deserialize(serialized);

			assert.equal(transaction.data, data);
		}
	});
});

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
			unvotes: [],
			votes: [],
		},
		fee: 1,
		nonce: 0,
		senderPublicKey: "A".repeat(64),
		type: Contracts.Crypto.TransactionType.Vote,
	};

	it("#getSchema - should be valid", ({ validator }) => {
		validator.addSchema(VoteTransaction.getSchema());

		assert.undefined(validator.validate("vote", transactionOriginal).error);
	});

	it("#getSchema - amount should be bigNumber, equal 0", ({ validator }) => {
		validator.addSchema(VoteTransaction.getSchema());

		const validValues = [0, "0", BigNumber.ZERO];
		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				amount: value,
			};

			assert.undefined(validator.validate("vote", transaction).error);
		}

		const invalidValues = [-1, 1.1, 1, BigNumber.ONE, "test", null, {}];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				amount: value,
			};

			assert.true(validator.validate("vote", transaction).error.includes("amount"));
		}
	});

	it("#getSchema - asset should be required object", ({ validator }) => {
		validator.addSchema(VoteTransaction.getSchema());

		const invalidValues = [1, BigNumber.ONE, "test", null, {}];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				asset: value,
			};

			assert.true(validator.validate("vote", transaction).error.includes("asset"));
		}
	});

	it("#getSchema - asset.votes should be required array with public keys, max 1", ({ validator }) => {
		validator.addSchema(VoteTransaction.getSchema());

		const validValues = ["a".repeat(64)];

		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				asset: {
					votes: [value],
					unvotes: [],
				},
			};

			assert.undefined(validator.validate("vote", transaction).error);
		}

		const invalidValues = ["a".repeat(63), "a".repeat(65), 1, BigNumber.ONE, "test", null, {}];
		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				asset: {
					votes: [value],
					unvotes: [],
				},
			};

			assert.true(validator.validate("vote", transaction).error.includes("votes"));
		}

		assert.true(
			validator
				.validate("vote", {
					...transactionOriginal,
					asset: {
						votes: ["a".repeat(64), "b".repeat(64)],
						unvotes: [],
					},
				})
				.error.includes("votes"),
		);
	});

	it("#getSchema - asset.unvotes should be required array with public keys, max 1", ({ validator }) => {
		validator.addSchema(VoteTransaction.getSchema());

		const validValues = ["a".repeat(64)];

		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				asset: {
					votes: [],
					unvotes: [value],
				},
			};

			assert.undefined(validator.validate("vote", transaction).error);
		}

		const invalidValues = ["a".repeat(63), "a".repeat(65), 1, BigNumber.ONE, "test", null, {}];
		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				asset: {
					votes: [],
					unvotes: [value],
				},
			};

			assert.true(validator.validate("vote", transaction).error.includes("unvotes"));
		}

		assert.true(
			validator
				.validate("vote", {
					...transactionOriginal,
					asset: {
						votes: [],
						unvotes: ["a".repeat(64), "b".repeat(64)],
					},
				})
				.error.includes("unvotes"),
		);
	});

	it("#getSchema - fee should be bigNumber, min 1", ({ validator }) => {
		validator.addSchema(VoteTransaction.getSchema());

		const validValues = [1, 100, BigNumber.ONE];
		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				fee: value,
			};

			assert.undefined(validator.validate("vote", transaction).error);
		}

		const invalidValues = [-1, 1.1, 0, BigNumber.ZERO, "test", null, undefined, {}];
		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				fee: value,
			};

			assert.true(validator.validate("vote", transaction).error.includes("fee"));
		}
	});

	it("#getSchema - type should be vote", ({ validator }) => {
		validator.addSchema(VoteTransaction.getSchema());

		const validValues = [Contracts.Crypto.TransactionType.Vote];
		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				type: value,
			};

			assert.undefined(validator.validate("vote", transaction).error);
		}

		const invalidValues = [
			-1,
			1.1,
			Contracts.Crypto.TransactionType.ValidatorRegistration,
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

			assert.true(validator.validate("vote", transaction).error.includes("type"));
		}
	});
});
