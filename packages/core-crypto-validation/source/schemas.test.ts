import { Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { Validator } from "@arkecosystem/core-validation/source/validator";

import cryptoJson from "../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../core-test-framework";
import { registerKeywords } from "./keywords";
import { schemas } from "./schemas";

describe<{
	sandbox: Sandbox;
	validator: Validator;
}>("Schemas", ({ it, assert, beforeEach }) => {
	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoJson);

		context.validator = context.sandbox.app.resolve(Validator);

		const formats = registerKeywords(
			context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration),
		);

		context.validator.extend((ajv) => {
			formats.transactionType(ajv);
		});

		context.validator.extend((ajv) => {
			formats.network(ajv);
		});

		context.validator.extend((ajv) => {
			formats.bignum(ajv);
		});

		context.validator.extend((ajv) => {
			formats.blockId(ajv);
		});

		context.validator.extend((ajv) => {
			formats.maxBytes(ajv);
		});

		for (const schema of Object.values(schemas)) {
			context.validator.addSchema(schema);
		}
	});

	it("address - should be ok", ({ validator }) => {
		assert.undefined(validator.validate("address", "a".repeat(62)).error);

		const validChars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

		for (const char of validChars) {
			assert.undefined(validator.validate("address", char.repeat(62)).error);
		}
	});

	it("address - should not be ok", ({ validator }) => {
		assert.defined(validator.validate("address", "a".repeat(61)).error);
		assert.defined(validator.validate("address", "a".repeat(63)).error);
		assert.defined(validator.validate("address", 123).error);
		assert.defined(validator.validate("address", null).error);
		assert.defined(validator.validate("address").error);
		assert.defined(validator.validate("address", {}).error);

		const invalidChars = "!#$%&'|+/";

		for (const char of invalidChars) {
			assert.defined(validator.validate("address", char.repeat(62)).error);
		}
	});

	it("alphanumeric - should be ok", ({ validator }) => {
		const validChars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

		for (const char of validChars) {
			assert.undefined(validator.validate("alphanumeric", char).error);
			assert.undefined(validator.validate("alphanumeric", char.repeat(20)).error);
		}
	});

	it("alphanumeric - should not be ok", ({ validator }) => {
		assert.defined(validator.validate("address", 123).error);
		assert.defined(validator.validate("address", null).error);
		assert.defined(validator.validate("address").error);
		assert.defined(validator.validate("address", {}).error);
	});

	it("hex - should be ok", ({ validator }) => {
		const validChars = "0123456789ABCDEFabcdef";

		for (const char of validChars) {
			assert.undefined(validator.validate("hex", char).error);
			assert.undefined(validator.validate("hex", char.repeat(20)).error);
		}
	});

	it("hex - should not be ok", ({ validator }) => {
		assert.defined(validator.validate("hex", 123).error);
		assert.defined(validator.validate("hex", null).error);
		assert.defined(validator.validate("hex").error);
		assert.defined(validator.validate("hex", {}).error);

		const invalidChars = "GHIJKLghijkl!#$%&'|+/";

		for (const char of invalidChars) {
			assert.defined(validator.validate("hex", char).error);
			assert.defined(validator.validate("hex", char.repeat(20)).error);
		}
	});

	it("publicKey - should be ok", ({ validator }) => {
		assert.undefined(validator.validate("publicKey", "0".repeat(64)).error);

		const validChars = "0123456789ABCDEFabcdef";

		for (const char of validChars) {
			assert.undefined(validator.validate("publicKey", char.repeat(64)).error);
		}
	});

	it("publicKey - should not be ok", ({ validator }) => {
		assert.defined(validator.validate("publicKey", "0".repeat(63)).error);
		assert.defined(validator.validate("publicKey", "0".repeat(65)).error);
		assert.defined(validator.validate("publicKey", 123).error);
		assert.defined(validator.validate("publicKey", null).error);
		assert.defined(validator.validate("publicKey").error);
		assert.defined(validator.validate("publicKey", {}).error);

		const invalidChars = "GHIJKLghijkl!#$%&'|+/";

		for (const char of invalidChars) {
			assert.defined(validator.validate("publicKey", char.repeat(64)).error);
		}
	});

	it("transactionId - should be ok", ({ validator }) => {
		assert.undefined(validator.validate("transactionId", "0".repeat(64)).error);

		const validChars = "0123456789ABCDEFabcdef";

		for (const char of validChars) {
			assert.undefined(validator.validate("transactionId", char.repeat(64)).error);
		}
	});

	it("transactionId - should not be ok", ({ validator }) => {
		assert.defined(validator.validate("transactionId", "0".repeat(63)).error);
		assert.defined(validator.validate("transactionId", "0".repeat(65)).error);
		assert.defined(validator.validate("transactionId", 123).error);
		assert.defined(validator.validate("transactionId", null).error);
		assert.defined(validator.validate("transactionId").error);
		assert.defined(validator.validate("transactionId", {}).error);

		const invalidChars = "GHIJKLghijkl!#$%&'|+/";

		for (const char of invalidChars) {
			assert.defined(validator.validate("transactionId", char.repeat(64)).error);
		}
	});

	it("validatorUsername - should be ok", ({ validator }) => {
		assert.undefined(validator.validate("validatorUsername", "0".repeat(1)).error);
		assert.undefined(validator.validate("validatorUsername", "0".repeat(20)).error);

		const validChars = "0123456789abcdefghijklmnopqrstuvwxyz!@$&_.";

		for (const char of validChars) {
			assert.undefined(validator.validate("validatorUsername", char.repeat(20)).error);
		}
	});

	it("validatorUsername - should not be ok", ({ validator }) => {
		assert.defined(validator.validate("validatorUsername", "0".repeat(21)).error);
		assert.defined(validator.validate("transactionId", 123).error);
		assert.defined(validator.validate("transactionId", null).error);
		assert.defined(validator.validate("transactionId").error);
		assert.defined(validator.validate("transactionId", {}).error);

		// TODO: Check
		// const invalidChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";

		// for (const char of invalidChars) {
		// 	assert.defined((await validator.validate("validatorUsername", char.repeat(20))).error);
		// }
	});

	const blockOriginal = {
		blockSignature: "123",
		generatorPublicKey: "a".repeat(64),
		height: 1,
		id: "1".repeat(64),
		numberOfTransactions: 0,
		payloadHash: "123",
		previousBlock: "0".repeat(64),
		reward: 0,
		timestamp: 0,
		totalAmount: 0,
		totalFee: 0,
		version: 1,
	};

	it("blockHeader - should be ok", async ({ validator }) => {
		const block = {
			...blockOriginal,
		};

		assert.undefined(validator.validate("blockHeader", blockOriginal).error);

		const optionalFields = ["numberOfTransactions", "payloadHash", "version"];

		for (const field of optionalFields) {
			const blockWithoutField = { ...blockOriginal };

			delete blockWithoutField[field];

			assert.undefined(validator.validate("blockHeader", blockWithoutField).error);
		}
	});

	it("blockHeader - should not be ok if any required field is missing", ({ validator }) => {
		const requiredFields = [
			"id",
			"timestamp",
			"previousBlock",
			"height",
			"totalAmount",
			"totalFee",
			"reward",
			"generatorPublicKey",
			"blockSignature",
		];

		for (const field of requiredFields) {
			const blockWithoutField = { ...blockOriginal };

			delete blockWithoutField[field];

			assert.defined(validator.validate("blockHeader", blockWithoutField).error);
		}
	});

	it("blockHeader - blockSignature should be hex", ({ validator }) => {
		const block = {
			...blockOriginal,
			blockSignature: "GHIJK",
		};

		assert.true(validator.validate("blockHeader", block).error.includes("blockSignature"));
	});

	it("blockHeader - generatorPublicKey should be publicKey", ({ validator }) => {
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					generatorPublicKey: "a".repeat(63),
				})
				.error.includes("generatorPublicKey"),
		);

		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					generatorPublicKey: "a".repeat(65),
				})
				.error.includes("generatorPublicKey"),
		);
	});

	it("blockHeader - height should be integer & min 1", ({ validator }) => {
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					height: "1",
				})
				.error.includes("height"),
		);

		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					height: 0,
				})
				.error.includes("height"),
		);

		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					height: -1,
				})
				.error.includes("height"),
		);
	});

	// it("blockHeader - id should be blockId", ({ validator }) => {
	// 	assert.true(
	// 		validator
	// 			.validate("blockHeader", {
	// 				...blockOriginal,
	// 				id: "1",
	// 			})
	// 			.error.includes("height"),
	// 	);
	// });

	it("blockHeader - numberOfTransactions should be integer & min 0", ({ validator }) => {
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					numberOfTransactions: "1",
				})
				.error.includes("numberOfTransactions"),
		);

		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					numberOfTransactions: -1,
				})
				.error.includes("numberOfTransactions"),
		);
	});

	it("blockHeader - payloadHash should be hex", ({ validator }) => {
		const block = {
			...blockOriginal,
			payloadHash: "GHIJK",
		};

		assert.true(validator.validate("blockHeader", block).error.includes("payloadHash"));
	});

	it("blockHeader - payloadLength should be integer & min 0", ({ validator }) => {
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					payloadLength: "1",
				})
				.error.includes("payloadLength"),
		);

		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					payloadLength: -1,
				})
				.error.includes("payloadLength"),
		);
	});

	it("blockHeader - id should be blockId", ({ validator }) => {
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					id: "1",
				})
				.error.includes("id"),
		);
	});

	it("blockHeader - reward should be bigNumber & min 0", ({ validator }) => {
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					reward: "-1",
				})
				.error.includes("reward"),
		);
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					reward: -1,
				})
				.error.includes("reward"),
		);
	});

	it("blockHeader - timestamp should be integer & min 0", ({ validator }) => {
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					timestamp: "1",
				})
				.error.includes("timestamp"),
		);

		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					timestamp: -1,
				})
				.error.includes("timestamp"),
		);
	});

	it("blockHeader - totalAmount should be bigNumber & min 0", ({ validator }) => {
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					totalAmount: -1,
				})
				.error.includes("totalAmount"),
		);
	});

	it("blockHeader - totalFee should be bigNumber & min 0", ({ validator }) => {
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					totalFee: -1,
				})
				.error.includes("totalFee"),
		);
	});

	it("blockHeader - version should be 1", ({ validator }) => {
		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					version: 0,
				})
				.error.includes("version"),
		);

		assert.true(
			validator
				.validate("blockHeader", {
					...blockOriginal,
					version: 2,
				})
				.error.includes("version"),
		);
	});

	// TODO: Check
	// it("block - shoudl be ok", ({ validator }) => {
	// 	const blockWithTransactions = {
	// 		...blockOriginal,
	// 		numberOfTransactions: 2,
	// 		transactions: [],
	// 	};

	// 	console.log(validator.validate("block", blockWithTransactions).error);
	// 	// assert.undefined((await validator.validate("block", blockWithTransactions)).error);
	// });
});
