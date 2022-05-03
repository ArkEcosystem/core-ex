import { AnySchemaObject } from "ajv";

export const schemas: Record<string, AnySchemaObject> = {
	transactionBaseSchema: {
		$id: undefined,
		// else: { required: ["type", "senderPublicKey", "fee", "amount", "nonce"] },
		// if: { properties: { version: { anyOf: [{ type: "null" }, { const: 1 }] } } },
		properties: {
			amount: { bignumber: { bypassGenesis: true, minimum: 1 } }, // TODO: remove bypassGenesis
			fee: { bignumber: { bypassGenesis: true, minimum: 0 } },
			id: { anyOf: [{ $ref: "transactionId" }, { type: "null" }] },
			network: { $ref: "networkByte" },
			nonce: { bignumber: { minimum: 0 } }, // TODO: Make required
			senderPublicKey: { $ref: "publicKey" },
			signature: { $ref: "alphanumeric" },
			signatures: {
				// additionalItems: false,
				items: { allOf: [{ maxLength: 130, minLength: 130 }, { $ref: "alphanumeric" }], type: "string" },
				maxItems: 16,
				minItems: 1,
				type: "array",
				uniqueItems: true,
			},
			typeGroup: { minimum: 0, type: "integer" },
			version: { enum: [1] },
		},
		// then: { required: ["type", "senderPublicKey", "fee", "amount"] },
		required: ["type", "senderPublicKey", "fee", "amount", "nonce"],
		type: "object",
	},
	transactionId: {
		$id: "transactionId",
		allOf: [{ maxLength: 64, minLength: 64 }, { $ref: "hex" }],
		type: "string",
	},
};
