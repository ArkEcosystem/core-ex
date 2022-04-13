import { constants } from "./constants";

export const replySchemas = {
	getBlocks: {
		items: {
			$ref: "blockHeader",
		},
		maxItems: 400,
		type: "array",
	},
	getCommonBlocks: {
		additionalProperties: false,
		properties: {
			common: {
				anyOf: [
					{
						properties: {
							height: {
								minimum: 1,
								type: "integer",
							},
							id: { blockId: {} },
						},
						required: ["height", "id"],
						type: "object",
					},
					{
						type: "null",
					},
				],
			},
		},
		required: ["common"],
		type: "object",
	},
	getPeers: {
		items: {
			properties: {
				ip: {
					anyOf: [
						{
							format: "ipv4",
							type: "string",
						},
						{
							format: "ipv6",
							type: "string",
						},
					],
				},
				port: {
					maximum: 65_535,
					minimum: 0,
					type: "integer",
				},
			},
			required: ["ip", "port"],
			type: "object",
		},
		maxItems: constants.MAX_PEERS_GETPEERS,
		type: "array",
	},
	getStatus: {
		additionalProperties: false,
		properties: {
			config: {
				additionalProperties: false,
				properties: {
					network: {
						additionalProperties: false,
						required: ["name", "nethash", "explorer", "token"],
						properties: {
							name: {
								minLength: 1,
								maxLength: 20,
								type: "string",
							},
							nethash: {
								allOf: [
									{
										$ref: "hex",
									},
									{
										minLength: 64,
										type: "string",
										maxLength: 64,
									},
								],
							},
							explorer: {
								minLength: 0,
								type: "string",
								maxLength: 128,
							},
							version: {
								type: "integer",
								minimum: 0,
								maximum: 255,
							},
							token: {
								required: ["name", "symbol"],
								additionalProperties: false,
								type: "object",
								properties: {
									name: {
										minLength: 1,
										maxLength: 8,
										type: "string",
									},
									symbol: {
										minLength: 1,
										maxLength: 4,
										type: "string",
									},
								},
							},
						},
						type: "object",
					},
					plugins: {
						additionalProperties: false,
						maxProperties: 32,
						minProperties: 0,
						type: "object",
						patternProperties: {
							"^.{4,64}$": {
								additionalProperties: false,
								required: ["port", "enabled"],
								properties: {
									enabled: {
										type: "boolean",
									},
									estimateTotalCount: {
										type: "boolean",
									},
									port: {
										type: "integer",
										minimum: 0,
										maximum: 65535,
									},
								},
								type: "object",
							},
						},
					},
					version: {
						minLength: 5,
						maxLength: 24,
						type: "string",
					},
				},
				required: ["version", "network", "plugins"],
				type: "object",
			},
			state: {
				properties: {
					currentSlot: {
						minimum: 1,
						type: "integer",
					},
					forgingAllowed: {
						type: "boolean",
					},
					header: {
						anyOf: [
							{
								$ref: "blockHeader",
							},
							{
								maxProperties: 0,
								minProperties: 0,
								type: "object",
							},
						],
					},
					height: {
						minimum: 1,
						type: "integer",
					},
				},
				required: ["height", "forgingAllowed", "currentSlot", "header"],
				type: "object",
			},
		},
		required: ["state", "config"],
		type: "object",
	},
	postBlock: {
		additionalProperties: false,
		properties: {
			height: { minimum: 1, type: "integer" },
			status: { type: "boolean" },
		},
		type: "object",
	},
	postTransactions: {
		type: "array",
	},
};
