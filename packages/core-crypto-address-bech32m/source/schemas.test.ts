import { Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { registerKeywords } from "@arkecosystem/core-crypto-validation";
import { Validator } from "@arkecosystem/core-validation/source/validator";

import cryptoJson from "../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../core-test-framework";
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
});