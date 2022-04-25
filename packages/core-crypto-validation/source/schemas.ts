export const schemas = {
	// @TODO: plugins should register this rule
	address: {
		$id: "address",
		allOf: [{ maxLength: 62, minLength: 62 }, { $ref: "bech32m" }],
	},

	alphanumeric: {
		$id: "alphanumeric",
		pattern: "^[a-zA-Z0-9]+$",
		type: "string",
	},

	base58: {
		$id: "base58",
		pattern: "^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$",
		type: "string",
	},

	bech32m: {
		$id: "bech32m",
		pattern: "^[0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz]+$",
		type: "string",
	},

	// @TODO: plugins should register this rule
	block: {
		$id: "block",
		$ref: "blockHeader",
		properties: {
			transactions: {
				$ref: "transactions",
				maxItems: { $data: "1/numberOfTransactions" },
				minItems: { $data: "1/numberOfTransactions" },
			},
		},
	},

	// @TODO: plugins should register this rule
	blockHeader: {
		$id: "blockHeader",
		properties: {
			blockSignature: { $ref: "hex" },
			generatorPublicKey: { $ref: "publicKey" },
			height: { minimum: 1, type: "integer" },
			id: { blockId: {} },
			numberOfTransactions: { type: "integer", minimum: 0 },
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

	// // @TODO: plugins should register this rule
	// genericName: {
	// 	$id: "genericName",
	// 	allOf: [
	// 		{ pattern: "^[a-zA-Z0-9]+(( - |[ ._-])[a-zA-Z0-9]+)*[.]?$", type: "string" },
	// 		{ maxLength: 40, minLength: 1 },
	// 	],
	// },

	hex: {
		$id: "hex",
		pattern: "^[0123456789A-Fa-f]+$",
		type: "string",
	},

	networkByte: {
		$id: "networkByte",
		network: true,
	},

	// @TODO: plugins should register this rule
	publicKey: {
		$id: "publicKey",
		allOf: [{ maxLength: 64, minLength: 64 }, { $ref: "hex" }, { transform: ["toLowerCase"] }], //64=schnorr,66=ecdsa
	},

	// @TODO: plugins should register this rule
	transactionId: {
		$id: "transactionId",
		allOf: [{ maxLength: 64, minLength: 64 }, { $ref: "hex" }],
	},

	// TODO: Uri format is missing
	uri: {
		$id: "uri",
		allOf: [{ format: "uri" }, { maxLength: 80, minLength: 4 }],
	},

	// @TODO: plugins should register this rule
	username: {
		$id: "validatorUsername",
		allOf: [
			{ pattern: "^[a-z0-9!@$&_.]+$", type: "string" },
			{ maxLength: 20, minLength: 1 },
			{ transform: ["toLowerCase"] },
		],
	},
};
