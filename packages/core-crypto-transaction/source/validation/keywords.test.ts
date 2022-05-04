import { Contracts } from "@arkecosystem/core-contracts";
import { Validator } from "@arkecosystem/core-validation/source/validator";

import { describe, Sandbox } from "../../../core-test-framework";
import { keywords } from "./keywords";

describe<{
	sandbox: Sandbox;
	validator: Validator;
}>("Keywords", ({ it, beforeEach, assert }) => {
	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.validator = context.sandbox.app.resolve(Validator);

		context.validator.addKeyword(keywords.transactionType);
	});

	it("keyword transactionType should be ok", (context) => {
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
});
