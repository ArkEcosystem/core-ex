import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { ServiceProvider as CryptoValidationServiceProvider } from "@arkecosystem/core-crypto-validation";
import { ServiceProvider as ValidationServiceProvider } from "@arkecosystem/core-validation";
import { BigNumber } from "@arkecosystem/utils";

import cryptoJson from "../../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../../core-test-framework";
import { extend, transactionBaseSchema } from "./schemas";

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

	const schema = extend(transactionBaseSchema, {
		$id: "transaction",
	});

	const transactionOriginal = {
		amount: 1,
		fee: 1,
		id: "1".repeat(64),
		network: 30,
		nonce: 0,
		senderPublicKey: "A".repeat(64),
		signature: "A".repeat(64),
		type: 1,
		typeGroup: 0,
		version: 1,
	};

	it("transactionBaseSchema - should be valid", async ({ validator }) => {
		validator.addSchema(schema);

		assert.undefined((await validator.validate("transaction", transactionOriginal)).error);
	});

	it("transactionBaseSchema - should have required fields", async ({ validator }) => {
		validator.addSchema(schema);

		const requiredFields = ["amount", "fee", "nonce", "senderPublicKey", "type"];
		for (const field of requiredFields) {
			const transaction = {
				...transactionOriginal,
			};

			delete transaction[field];

			assert.true((await validator.validate("transaction", transaction)).error.includes(field));
		}

		const optionalFields = ["id", "network", "signature", "typeGroup", "version"];
		for (const field of optionalFields) {
			const transaction = {
				...transactionOriginal,
			};

			delete transaction[field];

			assert.undefined((await validator.validate("transaction", transaction)).error);
		}
	});

	it("transactionBaseSchema - amount should be big number min 1", async ({ validator }) => {
		validator.addSchema(schema);

		const validValues = [1, "1", BigNumber.ONE, 100, "100", BigNumber.make(100)];

		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				amount: value,
			};

			assert.undefined((await validator.validate("transaction", transaction)).error);
		}

		const invalidValues = [0, "0", 1.1, BigNumber.ZERO, -1, null, undefined, {}, "test"];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				amount: value,
			};

			assert.true((await validator.validate("transaction", transaction)).error.includes("amount"));
		}
	});

	it("transactionBaseSchema - fee should be big number min 0", async ({ validator }) => {
		validator.addSchema(schema);

		const validValues = [0, "0", BigNumber.ZERO, 100, "100", BigNumber.make(100)];

		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				fee: value,
			};

			assert.undefined((await validator.validate("transaction", transaction)).error);
		}

		const invalidValues = [-1, "-1", 1.1, BigNumber.make(-1), -1, null, undefined, {}, "test"];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				fee: value,
			};

			assert.true((await validator.validate("transaction", transaction)).error.includes("fee"));
		}
	});

	it("transactionBaseSchema - id should be transactionId", async ({ validator }) => {
		validator.addSchema(schema);

		const validChars = "0123456789ABCDEFabcdef";

		for (const char of validChars) {
			const transaction = {
				...transactionOriginal,
				id: char.repeat(64),
			};

			assert.undefined((await validator.validate("transaction", transaction)).error);
		}

		const invalidValues = ["0".repeat(63), "0".repeat(65), "G".repeat(64), "g".repeat(64), {}, "test"];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				id: value,
			};

			assert.true((await validator.validate("transaction", transaction)).error.includes("id"));
		}
	});

	it("transactionBaseSchema - network should be valid networkByte", async ({ validator }) => {
		validator.addSchema(schema);

		const invalidValues = [20, {}, "test"];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				network: value,
			};

			assert.true((await validator.validate("transaction", transaction)).error.includes("network"));
		}
	});

	it("transactionBaseSchema - nonce should be big number min 0", async ({ validator }) => {
		validator.addSchema(schema);

		const validValues = [0, "0", BigNumber.ZERO, 100, "100", BigNumber.make(100)];

		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				nonce: value,
			};

			assert.undefined((await validator.validate("transaction", transaction)).error);
		}

		const invalidValues = [-1, "-1", 1.1, BigNumber.make(-1), -1, null, undefined, {}, "test"];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				nonce: value,
			};

			assert.true((await validator.validate("transaction", transaction)).error.includes("nonce"));
		}
	});

	it("transactionBaseSchema - signature should be alphanumeric", async ({ validator }) => {
		validator.addSchema(schema);

		const validChars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

		for (const char of validChars) {
			const transaction = {
				...transactionOriginal,
				signature: char,
			};

			assert.undefined((await validator.validate("transaction", transaction)).error);
		}

		const invalidValues = ["/", "!", "&", {}];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				signature: value,
			};

			assert.true((await validator.validate("transaction", transaction)).error.includes("signature"));
		}
	});

	it("transactionBaseSchema - signatures should be alphanumeric, 130 length, min 1 and max 16, unique items", async ({
		validator,
	}) => {
		validator.addSchema(schema);

		const validChars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

		for (const char of validChars) {
			const transaction = {
				...transactionOriginal,
				signatures: [char.repeat(130)],
			};

			assert.undefined((await validator.validate("transaction", transaction)).error);
		}

		const invalidValues = [
			"a".repeat(129),
			"a".repeat(131),
			"/".repeat(130),
			"!".repeat(130),
			"&".repeat(130),
			null,
			undefined,
			{},
		];
		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				signatures: [value],
			};

			assert.true((await validator.validate("transaction", transaction)).error.includes("signatures"));
		}

		// Len 0
		assert.true(
			(
				await validator.validate("transaction", {
					...transactionOriginal,
					signatures: [],
				})
			).error.includes("signatures"),
		);

		// Len > 16
		assert.true(
			(
				await validator.validate("transaction", {
					...transactionOriginal,
					signatures: [
						"a".repeat(130),
						"b".repeat(130),
						"c".repeat(130),
						"d".repeat(130),
						"e".repeat(130),
						"f".repeat(130),
						"g".repeat(130),
						"h".repeat(130),
						"i".repeat(130),
						"j".repeat(130),
						"k".repeat(130),
						"l".repeat(130),
						"m".repeat(130),
						"n".repeat(130),
						"o".repeat(130),
						"p".repeat(130),
						"r".repeat(130),
					],
				})
			).error.includes("signatures"),
		);

		// Unique
		assert.true(
			(
				await validator.validate("transaction", {
					...transactionOriginal,
					signatures: ["a".repeat(130), "a".repeat(130)],
				})
			).error.includes("signatures"),
		);
	});

	it("transactionBaseSchema - typeGroup should be integer min 0", async ({ validator }) => {
		validator.addSchema(schema);

		const validValues = [0, 1, 100];

		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				typeGroup: value,
			};

			assert.undefined((await validator.validate("transaction", transaction)).error);
		}

		const invalidValues = [-1, "-1", 1.1, BigNumber.make(1), {}, "test"];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				typeGroup: value,
			};

			assert.true((await validator.validate("transaction", transaction)).error.includes("typeGroup"));
		}
	});

	it("transactionBaseSchema - version should be 1", async ({ validator }) => {
		validator.addSchema(schema);

		const validValues = [1];

		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				version: value,
			};

			assert.undefined((await validator.validate("transaction", transaction)).error);
		}

		const invalidValues = [-1, "1", 0, BigNumber.make(1), {}, "test"];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				version: value,
			};

			assert.true((await validator.validate("transaction", transaction)).error.includes("version"));
		}
	});
});
