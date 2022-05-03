import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { Validator } from "@arkecosystem/core-validation/source/validator";
import { BigNumber } from "@arkecosystem/utils";

import cryptoJson from "../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../core-test-framework";
import { registerKeywords } from "./keywords";

type Context = {
	validator: Validator;
	sandbox: Sandbox;
};

describe<{
	sandbox: Sandbox;
	validator: Validator;
}>("Keywords", ({ it, beforeEach, assert }) => {
	const register = ({ sandbox, validator }: Context) => {
		const formats = registerKeywords(sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration));

		validator.extend((ajv) => {
			formats.transactionType(ajv);
		});

		validator.extend((ajv) => {
			formats.network(ajv);
		});

		validator.extend((ajv) => {
			formats.bignum(ajv);
		});

		validator.extend((ajv) => {
			formats.maxBytes(ajv);
		});
	};

	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoJson);

		context.validator = context.sandbox.app.resolve(Validator);
	});

	// TODO: Parent schema !== string
	// TODO: Negative value
	it("keyword maxBytes should be ok", (context) => {
		register(context);

		const schema = {
			$id: "test",
			maxBytes: 64,
			type: "string",
		};
		context.validator.addSchema(schema);

		assert.undefined(context.validator.validate("test", "1234").error);
		assert.undefined(context.validator.validate("test", "a".repeat(64)).error);
		assert.undefined(context.validator.validate("test", "⊁".repeat(21)).error);

		assert.defined(context.validator.validate("test", "a".repeat(65)).error);
		assert.defined(context.validator.validate("test", "⊁".repeat(22)).error);
		assert.defined(context.validator.validate("test", {}).error);
		assert.defined(context.validator.validate("test", null).error);
		assert.defined(context.validator.validate("test").error);
		assert.defined(context.validator.validate("test", 123).error);
	});

	// TODO: Flase value
	it("keyword network should be ok", (context) => {
		register(context);

		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).set("network", {});

		const schema = {
			$id: "test",
			network: true,
		};
		context.validator.addSchema(schema);

		assert.undefined(context.validator.validate("test", 30).error);
		assert.undefined(context.validator.validate("test", 23).error);
		assert.undefined(context.validator.validate("test", "a").error);
	});

	it("keyword network - should return true when network is not set in configuration", (context) => {
		register(context);

		const schema = {
			$id: "test",
			network: true,
		};
		context.validator.addSchema(schema);

		assert.undefined(context.validator.validate("test", 30).error);

		assert.defined(context.validator.validate("test", 23).error);
		assert.defined(context.validator.validate("test", "a").error);
	});

	it("keyword transactionType should be ok", (context) => {
		register(context);

		const schema = {
			$id: "test",
			transactionType: Contracts.Crypto.TransactionType.Transfer,
		};
		context.validator.addSchema(schema);

		assert.undefined(context.validator.validate("test", Contracts.Crypto.TransactionType.Transfer).error);

		assert.defined(context.validator.validate("test", Contracts.Crypto.TransactionType.Vote).error);
		assert.defined(context.validator.validate("test", -1).error);
		assert.defined(context.validator.validate("test", "").error);
		assert.defined(context.validator.validate("test", "0").error);
		assert.defined(context.validator.validate("test", null).error);
		assert.defined(context.validator.validate("test").error);
	});

	it("keyword bignumber should be ok if only one possible value is allowed", (context) => {
		register(context);

		const schema = {
			$id: "test",
			bignumber: { maximum: 100, minimum: 100 },
		};
		context.validator.addSchema(schema);

		assert.undefined(context.validator.validate("test", 100).error);

		assert.defined(context.validator.validate("test", 99).error);
		assert.defined(context.validator.validate("test", 101).error);
		assert.defined(context.validator.validate("test", null).error);
		assert.defined(context.validator.validate("test").error);
		assert.defined(context.validator.validate("test", {}).error);
	});

	it("keyword bignumber should be ok if above or equal minimum", (context) => {
		register(context);

		const schema = {
			$id: "test",
			bignumber: { minimum: 20 },
		};
		context.validator.addSchema(schema);

		assert.undefined(context.validator.validate("test", 25).error);
		assert.undefined(context.validator.validate("test", 20).error);

		assert.defined(context.validator.validate("test", 19).error);
	});

	it("keyword bignumber should be ok if below or equal maximum", (context) => {
		register(context);

		const schema = {
			$id: "test",
			bignumber: { maximum: 20 },
		};
		context.validator.addSchema(schema);

		assert.undefined(context.validator.validate("test", 19).error);
		assert.undefined(context.validator.validate("test", 20).error);
		assert.undefined(context.validator.validate("test", 0).error);

		// assert.undefined((await context.validator.validate("test", -1)).error); TODO: Min is defined to 0, make test

		assert.defined(context.validator.validate("test", 21).error);
	});

	it("keyword bignumber should not be ok for values bigger than the absolute maximum", (context) => {
		register(context);

		const schema = {
			$id: "test",
			bignumber: {},
		};
		context.validator.addSchema(schema);

		assert.undefined(context.validator.validate("test", Number.MAX_SAFE_INTEGER).error);

		assert.defined(context.validator.validate("test", 9_223_372_036_854_775_808).error);
	});

	it("keyword bignumber should be ok for number, string and bignumber as input", (context) => {
		register(context);

		const schema = {
			$id: "test",
			bignumber: { maximum: 2000, minimum: 100, type: "number" },
		};
		context.validator.addSchema(schema);

		for (const value of [100, 1e2, 1020, 500, 2000]) {
			assert.undefined(context.validator.validate("test", value).error);
			assert.undefined(context.validator.validate("test", value.toString()).error);
			assert.undefined(context.validator.validate("test", BigNumber.make(value)).error);
		}

		for (const value of [1e8, 1999.000_001, 1 / 1e8, -100, -500, -2000.1]) {
			assert.defined(context.validator.validate("test", value).error);
			assert.defined(context.validator.validate("test", value.toString()).error);
			// assert.defined((await context.validator.validate("test", BigNumber.make(value))).error);
		}
	});

	it("keyword bignumber should not accept garbage", (context) => {
		register(context);

		const schema = {
			$id: "test",
			bignumber: {},
		};
		context.validator.addSchema(schema);

		assert.defined(context.validator.validate("test").error);
		assert.defined(context.validator.validate("test", {}).error);
		assert.defined(context.validator.validate("test", /d+/).error);
		assert.defined(context.validator.validate("test", "").error);
		assert.defined(context.validator.validate("test", "\u0000").error);
	});

	it.only("keyword bignumber should allow 0 if genensis transaction and bypassGenesis = true", (context) => {
		register(context);

		const schema = {
			$id: "test",
			properties: {
				fee: {
					bignumber: {
						bypassGenesis: true,
						minimum: 3,
					},
				},
				id: { type: "string" },
			},
			type: "object",
		};
		context.validator.addSchema(schema);

		assert.undefined(
			context.validator.validate("test", {
				fee: 0,
				id: "11a3f21c885916c287fae237200aee883555f3a7486457ec2d6434d9646d72c8",
			}).error,
		);
	});

	it("keyword bignumber should allow 0 for any transaction when genesisBlock is not set and bypassGenesis = true", (context) => {
		register(context);

		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).set("genesisBlock", {});

		const schema = {
			$id: "test",
			properties: {
				fee: {
					bignumber: {
						bypassGenesis: true,
						minimum: 3,
					},
				},
				id: { type: "string" },
			},
		};
		context.validator.addSchema(schema);

		assert.undefined(
			context.validator.validate("test", {
				fee: 0,
				id: "random",
			}).error,
		);
	});

	it("keyword bignumber should not allow 0 if genensis transaction and bypassGenesis = false", (context) => {
		register(context);

		const schema = {
			$id: "test",
			properties: {
				fee: {
					bignumber: {
						bypassGenesis: false,
						minimum: 3,
					},
				},
				id: { type: "string" },
			},
		};
		context.validator.addSchema(schema);

		assert.defined(
			context.validator.validate("test", {
				fee: 0,
				id: "11a3f21c885916c287fae237200aee883555f3a7486457ec2d6434d9646d72c8",
			}).error,
		);
	});

	// // it("keyword bignumber should cast number to Bignumber", async (context) => {
	// // 	const schema = {
	// // 		$id: "test",
	// // 		properties: {
	// // 			amount: { bignumber: {} },
	// // 		},
	// // 		type: "object",
	// // 	};
	// // 	context.validator.addSchema(schema);

	// // 	const data = {
	// // 		amount: 100,
	// // 	};

	// // 	assert.undefined((await context.validator.validate("test", data)).error);
	// // 	// assert.instance(data.amount, BigNumber);
	// // 	// assert.equal(data.amount, Utils.BigNumber.make(100));
	// // });

	// // it("keyword bignumber should cast string to Bignumber", async (context) => {
	// // 	const schema = {
	// // 		$id: "test",
	// // 		properties: {
	// // 			amount: { bignumber: {} },
	// // 		},
	// // 		type: "object",
	// // 	};
	// // 	context.validator.addSchema(schema);

	// // 	const data = {
	// // 		amount: "100",
	// // 	};

	// // 	assert.undefined((await context.validator.validate("test", data)).error);

	// // 	// const validate = context.ajv.compile(schema);
	// // 	// assert.true(validate(data));
	// // 	// assert.instance(data.amount, Utils.BigNumber);
	// // 	// assert.equal(data.amount, Utils.BigNumber.make(100));
	// // });

	// // it("keyword bignumber bypassGenesis should be ok", (context) => {
	// // 	const schema = {
	// // 		properties: {
	// // 			amount: { bignumber: { bypassGenesis: true, minimum: 100, type: "number" } },
	// // 		},
	// // 		type: "object",
	// // 	};

	// // 	const validate = context.ajv.compile(schema);

	// // 	assert.true(validate({ amount: 0, id: "3e3817fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572" }));
	// // 	assert.false(validate({ amount: 0, id: "affe17fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572" }));
	// // 	assert.false(validate({ amount: 0 }));
	// // });
});
