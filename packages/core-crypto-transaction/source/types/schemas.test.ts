import { describe, Sandbox } from "../../../core-test-framework";
import { Validator } from "@arkecosystem/core-validation/source/validator";
import { extend, transactionBaseSchema } from "./schemas";
// import { TransactionType } from "../enums";
// import { BuilderFactory, TransactionTypeFactory } from "../transactions";
// import { TransactionSchema } from "../transactions/types/schemas";
// import { validator as Ajv } from "../validation";
// // import { MultiSignatureBuilder } from "./builders/transactions/multi-signature";
// import { TransferBuilder } from "./builders/transactions/transfer";

const ARKTOSHI = 1e8;

// const signTransaction = (tx: MultiSignatureBuilder, values: string[]): void => {
// 	values.map((value, index) => tx.multiSign(value, index));
// };

describe<{
	sandbox: Sandbox;
	validator: Validator;

	// address: string;
	// fee: number;
	// amount: string;
	// transaction: TransferBuilder;
	// transactionSchema: TransactionSchema;
}>("Schemas", ({ it, beforeAll, beforeEach, assert }) => {
	// beforeAll((context) => {
	// 	context.transactionSchema = TransactionTypeFactory.get(TransactionType.Transfer).getSchema();

	// 	context.address = "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh";
	// 	context.fee = 1 * ARKTOSHI;
	// 	context.amount = (10 * ARKTOSHI).toString();
	// });

	beforeEach((context) => {
		context.sandbox = new Sandbox();
		context.validator = context.sandbox.app.resolve(Validator);
		// context.transaction = BuilderFactory.transfer();
	});

	it("should be valid", async ({ validator }) => {
		const schema = extend(transactionBaseSchema, {
			$id: "transaction",
		});

		validator.addSchema(schema);

		console.log(
			await validator.validate("transaction", {
				amount: 1,
				fee: 1,
				id: 1,
			}),
		);

		// context.transaction.recipientId(context.address).amount(context.amount).sign("passphrase");
		// const { error } = Ajv.validate(context.transactionSchema.$id, context.transaction.getStruct());
		// assert.undefined(error);
	});
});
