import { Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { Validator } from "@arkecosystem/core-validation/source/validator";

import cryptoJson from "../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../core-test-framework";
import { blockId } from "./keywords";

describe<{
	sandbox: Sandbox;
	validator: Validator;
}>("Keywords", ({ it, beforeEach, assert }) => {
	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoJson);

		context.validator = context.sandbox.app.resolve(Validator);

		context.validator.addKeyword(blockId);
	});

	// TODO: Properties
	it("keyword blockId should be ok", (context) => {
		const schema = {
			$id: "test",
			blockId: {},
			type: "string",
		};
		context.validator.addSchema(schema);

		assert.undefined(context.validator.validate("test", "1".repeat(64)).error);

		assert.defined(context.validator.validate("test", "1".repeat(63)).error);
		assert.defined(context.validator.validate("test", "1".repeat(63)).error);
		assert.defined(context.validator.validate("test", "1".repeat(65)).error);
		assert.defined(context.validator.validate("test", "").error);
		assert.defined(context.validator.validate("test", null).error);
		assert.defined(context.validator.validate("test").error);
		assert.defined(context.validator.validate("test", {}).error);
	});

	// TODO: check if still required
	it("keyword blockId - should allow null for geneis", (context) => {
		const schema = {
			$id: "test",
			properties: {
				height: { type: "number" },
				id: {
					blockId: {
						allowNullWhenGenesis: true,
					},
				},
			},
			type: "object",
		};
		context.validator.addSchema(schema);

		assert.undefined(context.validator.validate("test", { height: 1, id: "1".repeat(64) }).error);
		assert.undefined(context.validator.validate("test", { height: 1, id: null }).error);
	});
});
