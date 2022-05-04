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
});
