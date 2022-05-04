import { Contracts } from "@arkecosystem/core-contracts";
import { FuncKeywordDefinition } from "ajv";

export const makeKeywords = (configuration: Contracts.Crypto.IConfiguration) => {
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

	const network: FuncKeywordDefinition = {
		compile(schema) {
			return (data) => {
				const networkHash = configuration.get("network.pubKeyHash");
				if (!networkHash) {
					return true;
				}
				return schema && data === networkHash;
			};
		},
		errors: false,
		keyword: "network",
		metaSchema: {
			type: "boolean",
		},
	};

	return {
		network,
		transactionType,
	};
};
