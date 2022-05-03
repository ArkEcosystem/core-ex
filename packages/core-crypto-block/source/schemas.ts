import { AnySchemaObject } from "ajv";

export const schemas: Record<string, AnySchemaObject> = {
	block: {
		$id: "block",
		$ref: "blockHeader",
		properties: {
			transactions: {
				// TODO: Handle transactions
				// $ref: "transactions",
				maxItems: { $data: "1/numberOfTransactions" },
				minItems: { $data: "1/numberOfTransactions" },
				type: "array",
			},
		},
		type: "object",
	},
	blockHeader: {
		$id: "blockHeader",
		properties: {
			blockSignature: { $ref: "hex" },
			generatorPublicKey: { $ref: "publicKey" },
			height: { minimum: 1, type: "integer" },
			id: { blockId: {} },
			numberOfTransactions: { minimum: 0, type: "integer" },
			payloadHash: { $ref: "hex" },
			payloadLength: { minimum: 0, type: "integer" },
			previousBlock: { blockId: { allowNullWhenGenesis: true, isPreviousBlock: true } }, // TODO: Check blockId props
			reward: { bignumber: { minimum: 0 } },
			timestamp: { minimum: 0, type: "integer" },
			totalAmount: { bignumber: { block: true, bypassGenesis: true, minimum: 0 } }, // TODO: Check bypassGenesis
			totalFee: { bignumber: { block: true, bypassGenesis: true, minimum: 0 } }, // TODO: Check bypassGenesis
			version: { enum: [1] },
		},
		required: [
			"id",
			"timestamp",
			"previousBlock",
			"height",
			"totalAmount",
			"totalFee",
			"reward",
			"generatorPublicKey",
			"blockSignature",
		],
		type: "object",
	},
};
