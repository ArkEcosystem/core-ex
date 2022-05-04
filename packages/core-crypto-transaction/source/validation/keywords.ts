import { FuncKeywordDefinition } from "ajv";

const transactionType: FuncKeywordDefinition = {
	compile(schema) {
		return (data) =>
			// Impose dynamic multipayment limit based on milestone
			// TODO: Move under multi payment
			// if (
			// 	data === Contracts.Crypto.TransactionType.MultiPayment &&
			// 	parentObject &&
			// 	(!parentObject.typeGroup || parentObject.typeGroup === 1) &&
			// 	parentObject.asset &&
			// 	parentObject.asset.payments
			// ) {
			// 	const limit: number = configuration.getMilestone().multiPaymentLimit || 256;
			// 	return parentObject.asset.payments.length <= limit;
			// }

			data === schema;
	},

	errors: false,
	keyword: "transactionType",
	metaSchema: {
		minimum: 0,
		type: "integer",
	},
};

export const keywords = {
	transactionType,
};
