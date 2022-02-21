import deepmerge from "deepmerge";

import { TransactionType } from "../../enums";

const signedTransaction = {
	anyOf: [
		{ required: ["id", "signature"] },
		{ required: ["id", "signature", "signatures"] },
		{ required: ["id", "signatures"] },
	],
};

const strictTransaction = {
	additionalProperties: false,
};

export const transactionBaseSchema: Record<string, any> = {
	$id: undefined,
	type: "object",
	if: { properties: { version: { anyOf: [{ type: "null" }, { const: 1 }] } } },
	then: { required: ["type", "senderPublicKey", "fee", "amount", "timestamp"] },
	else: { required: ["type", "senderPublicKey", "fee", "amount", "nonce"] },
	properties: {
		id: { anyOf: [{ $ref: "transactionId" }, { type: "null" }] },
		version: { enum: [1, 2] },
		network: { $ref: "networkByte" },
		timestamp: { type: "integer", minimum: 0 },
		nonce: { bignumber: { minimum: 0 } },
		typeGroup: { type: "integer", minimum: 0 },
		amount: { bignumber: { minimum: 1, bypassGenesis: true } },
		fee: { bignumber: { minimum: 0, bypassGenesis: true } },
		senderPublicKey: { $ref: "publicKey" },
		signature: { $ref: "alphanumeric" },
		signatures: {
			type: "array",
			minItems: 1,
			maxItems: 16,
			additionalItems: false,
			uniqueItems: true,
			items: { allOf: [{ minLength: 130, maxLength: 130 }, { $ref: "alphanumeric" }] },
		},
	},
};

export const extend = (parent, properties): TransactionSchema => {
	return deepmerge(parent, properties);
};

export const signedSchema = (schema: TransactionSchema): TransactionSchema => {
	const signed = extend(schema, signedTransaction);
	signed.$id = `${schema.$id}Signed`;
	return signed;
};

export const strictSchema = (schema: TransactionSchema): TransactionSchema => {
	const signed = signedSchema(schema);
	const strict = extend(signed, strictTransaction);
	strict.$id = `${schema.$id}Strict`;
	return strict;
};

export const transfer = extend(transactionBaseSchema, {
	$id: "transfer",
	required: ["recipientId"],
	properties: {
		type: { transactionType: TransactionType.Transfer },
		fee: { bignumber: { minimum: 1, bypassGenesis: true } },
		vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
		recipientId: { $ref: "address" },
		expiration: { type: "integer", minimum: 0 },
	},
});

export const delegateRegistration = extend(transactionBaseSchema, {
	$id: "delegateRegistration",
	required: ["asset"],
	properties: {
		type: { transactionType: TransactionType.DelegateRegistration },
		amount: { bignumber: { minimum: 0, maximum: 0 } },
		fee: { bignumber: { minimum: 1, bypassGenesis: true } },
		asset: {
			type: "object",
			required: ["delegate"],
			properties: {
				delegate: {
					type: "object",
					required: ["username"],
					properties: {
						username: { $ref: "delegateUsername" },
					},
				},
			},
		},
	},
});

export const vote = extend(transactionBaseSchema, {
	$id: "vote",
	required: ["asset"],
	properties: {
		type: { transactionType: TransactionType.Vote },
		amount: { bignumber: { minimum: 0, maximum: 0 } },
		fee: { bignumber: { minimum: 1 } },
		recipientId: { $ref: "address" },
		asset: {
			type: "object",
			required: ["votes"],
			properties: {
				votes: {
					type: "array",
					minItems: 1,
					maxItems: 2,
					additionalItems: false,
					items: { $ref: "walletVote" },
				},
			},
		},
	},
});

export const multiSignature = extend(transactionBaseSchema, {
	$id: "multiSignature",
	required: ["asset", "signatures"],
	properties: {
		type: { transactionType: TransactionType.MultiSignature },
		amount: { bignumber: { minimum: 0, maximum: 0 } },
		fee: { bignumber: { minimum: 1 } },
		asset: {
			type: "object",
			required: ["multiSignature"],
			properties: {
				multiSignature: {
					type: "object",
					required: ["min", "publicKeys"],
					properties: {
						min: {
							type: "integer",
							minimum: 1,
							maximum: { $data: "1/publicKeys/length" },
						},
						publicKeys: {
							type: "array",
							minItems: 1,
							maxItems: 16,
							additionalItems: false,
							uniqueItems: true,
							items: { $ref: "publicKey" },
						},
					},
				},
			},
		},
		signatures: {
			type: "array",
			minItems: { $data: "1/asset/multiSignature/min" },
			maxItems: { $data: "1/asset/multiSignature/publicKeys/length" },
			additionalItems: false,
			uniqueItems: true,
			items: { allOf: [{ minLength: 130, maxLength: 130 }, { $ref: "alphanumeric" }] },
		},
	},
});

// Multisignature legacy transactions have a different signatures property.
// Then we delete the "signatures" property definition to implement our own.
const transactionBaseSchemaNoSignatures = extend(transactionBaseSchema, {});
delete transactionBaseSchemaNoSignatures.properties.signatures;
export const multiSignatureLegacy = extend(transactionBaseSchemaNoSignatures, {
	$id: "multiSignatureLegacy",
	required: ["asset"],
	properties: {
		version: { anyOf: [{ type: "null" }, { const: 1 }] },
		type: { transactionType: TransactionType.MultiSignature },
		amount: { bignumber: { minimum: 0, maximum: 0 } },
		fee: { bignumber: { minimum: 1 } },
		asset: {
			type: "object",
			required: ["multiSignatureLegacy"],
			properties: {
				multiSignatureLegacy: {
					type: "object",
					required: ["keysgroup", "min", "lifetime"],
					properties: {
						min: {
							type: "integer",
							minimum: 1,
							maximum: { $data: "1/keysgroup/length" },
						},
						lifetime: {
							type: "integer",
							minimum: 1,
							maximum: 72,
						},
						keysgroup: {
							type: "array",
							minItems: 1,
							maxItems: 16,
							additionalItems: false,
							items: {
								allOf: [{ type: "string", minimum: 67, maximum: 67, transform: ["toLowerCase"] }],
							},
						},
					},
				},
			},
		},
		signatures: {
			type: "array",
			minItems: 1,
			maxItems: 1,
			additionalItems: false,
			items: { $ref: "alphanumeric" },
		},
	},
});

export const multiPayment = extend(transactionBaseSchema, {
	$id: "multiPayment",
	properties: {
		type: { transactionType: TransactionType.MultiPayment },
		amount: { bignumber: { minimum: 0, maximum: 0 } },
		fee: { bignumber: { minimum: 1 } },
		vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
		asset: {
			type: "object",
			required: ["payments"],
			properties: {
				payments: {
					type: "array",
					minItems: 2,
					additionalItems: false,
					uniqueItems: false,
					items: {
						type: "object",
						required: ["amount", "recipientId"],
						properties: {
							amount: { bignumber: { minimum: 1 } },
							recipientId: { $ref: "address" },
						},
					},
				},
			},
		},
	},
});

export const delegateResignation = extend(transactionBaseSchema, {
	$id: "delegateResignation",
	properties: {
		type: { transactionType: TransactionType.DelegateResignation },
		amount: { bignumber: { minimum: 0, maximum: 0 } },
		fee: { bignumber: { minimum: 1 } },
	},
});

export type TransactionSchema = typeof transactionBaseSchema;