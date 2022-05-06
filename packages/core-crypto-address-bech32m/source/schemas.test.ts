import { Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { schemas as baseSchemas } from "@arkecosystem/core-crypto-validation";
import { Validator } from "@arkecosystem/core-validation/source/validator";

import cryptoJson from "../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../core-test-framework";
import { schemas } from "./schemas";

describe<{
	sandbox: Sandbox;
	validator: Validator;
}>("Schemas", ({ it, assert, beforeEach }) => {
	const length = 62;

	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoJson);

		context.validator = context.sandbox.app.resolve(Validator);

		for (const schema of Object.values({
			...baseSchemas,
			...schemas,
		})) {
			context.validator.addSchema(schema);
		}
	});

	it("address - should be ok", ({ validator }) => {
		assert.undefined(validator.validate("address", "a".repeat(length)).error);

		const validChars = "0123456789abcdefghijklmnopqrstuvwxyz";

		for (const char of validChars) {
			assert.undefined(validator.validate("address", char.repeat(length)).error);
		}
	});

	it("address - should not be ok", ({ validator }) => {
		assert.defined(validator.validate("address", "a".repeat(length - 1)).error);
		assert.defined(validator.validate("address", "a".repeat(length + 1)).error);
		assert.defined(validator.validate("address", 123).error);
		assert.defined(validator.validate("address", null).error);
		assert.defined(validator.validate("address").error);
		assert.defined(validator.validate("address", {}).error);

		const invalidChars = "ABCDEFGHJKLMNPQRSTUVWXYZ!#$%&'|+/";

		for (const char of invalidChars) {
			assert.defined(validator.validate("address", char.repeat(length)).error);
		}
	});
});
