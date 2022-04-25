import { Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { Validator } from "@arkecosystem/core-validation/source/validator";

import cryptoJson from "../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../core-test-framework";
import { registerFormats } from "./formats";

type Context = {
	validator: Validator;
	sandbox: Sandbox;
};

describe<Context>("format vendorField", ({ it, assert, beforeEach }) => {
	const register = ({ sandbox, validator }: Context) => {
		const formats = registerFormats(sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration));

		validator.extend((ajv) => {
			formats.vendorField(ajv);
		});

		validator.extend((ajv) => {
			formats.validPeer(ajv);
		});
	};

	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoJson);

		context.validator = context.sandbox.app.resolve(Validator);
	});

	it("#vendorField - should be ok", async (context) => {
		register(context);

		const schema = {
			$id: "test",
			format: "vendorField",
			type: "string",
		};
		context.validator.addSchema(schema);

		assert.undefined((await context.validator.validate("test", "false")).error);
		assert.undefined((await context.validator.validate("test", "a".repeat(255))).error);
		assert.undefined((await context.validator.validate("test", "⊁".repeat(85))).error);
	});

	it("#vendorField - should not be ok", async (context) => {
		register(context);

		const schema = {
			$id: "test",
			format: "vendorField",
			type: "string",
		};
		context.validator.addSchema(schema);

		assert.defined((await context.validator.validate("test", "a".repeat(256))).error);
		assert.defined((await context.validator.validate("test", "⊁".repeat(86))).error);
		assert.defined((await context.validator.validate("test", {})).error);
		assert.defined((await context.validator.validate("test", null)).error);
		assert.defined((await context.validator.validate("test")).error);
	});

	it("#peer - should be ok", async (context) => {
		register(context);

		const schema = {
			$id: "test",
			format: "peer",
			type: "string",
		};
		context.validator.addSchema(schema);

		assert.undefined((await context.validator.validate("test", "192.168.178.0")).error);
		assert.undefined((await context.validator.validate("test", "5.196.105.32")).error);
	});

	it("#peer - should not be ok", async (context) => {
		register(context);

		const schema = {
			$id: "test",
			format: "peer",
			type: "string",
		};
		context.validator.addSchema(schema);

		assert.defined((await context.validator.validate("test", "aaaa")).error);
		assert.defined((await context.validator.validate("test", "127.0.0.1")).error);
		assert.defined((await context.validator.validate("test", null)).error);
		assert.defined((await context.validator.validate("test", {})).error);
		assert.defined((await context.validator.validate("test")).error);
	});
});
