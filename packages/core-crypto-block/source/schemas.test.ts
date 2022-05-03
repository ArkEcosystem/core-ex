import { Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { registerKeywords, schemas as sharedSchemas } from "@arkecosystem/core-crypto-validation";
import { Validator } from "@arkecosystem/core-validation/source/validator";

import cryptoJson from "../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../core-test-framework";
import { blockId } from "./keywords";
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
			formats.maxBytes(ajv);
		});

		for (const schema of Object.values(sharedSchemas)) {
			context.validator.addSchema(schema);
		}

		context.validator.addKeyword(blockId);

		context.validator.addSchema(schemas.blockHeader);
		context.validator.addSchema(schemas.block);
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

		assert.undefined(validator.validate("blockHeader", block).error);

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

	it("block - transactions count should be equal numberOfTransactions", ({ validator }) => {
		assert.undefined(
			validator.validate("block", { ...blockOriginal, numberOfTransactions: 2, transactions: [{}, {}] }).error,
		);

		assert.defined(
			validator.validate("block", { ...blockOriginal, numberOfTransactions: 2, transactions: [{}] }).error,
		);

		assert.defined(
			validator.validate("block", { ...blockOriginal, numberOfTransactions: 2, transactions: [{}, {}, {}] })
				.error,
		);
	});
});
