// @ts-nocheck
import { Contracts } from "@arkecosystem/core-contracts";
import { BigNumber } from "@arkecosystem/utils";
import { Ajv } from "ajv";
import ajvKeywords from "ajv-keywords";

let genesisTransactions;

const isGenesisTransaction = (configuration: Contracts.Crypto.IConfiguration, id: string) => {
	if (!configuration.get("genesisBlock.transactions")) {
		return true;
	}

	if (!genesisTransactions) {
		genesisTransactions = configuration
			.get("genesisBlock.transactions")
			.reduce((acc, curr) => Object.assign(acc, { [curr.id]: true }), {});
	}

	return !!genesisTransactions[id];
};

export const registerKeywords = (configuration: Contracts.Crypto.IConfiguration) => {
	const maxBytes = (ajv: Ajv) => {
		ajv.addKeyword("maxBytes", {
			compile(schema, parentSchema) {
				return (data) => {
					// if ((parentSchema as any).type !== "string") {
					// 	return false;
					// }

					return Buffer.from(data, "utf8").byteLength <= schema;
				};
			},
			errors: false,
			metaSchema: {
				minimum: 0,
				type: "integer",
			},
			type: "string",
		});
	};

	const transactionType = (ajv: Ajv) => {
		ajv.addKeyword("transactionType", {
			// @ts-ignore
			compile(schema) {
				return (data, dataPath, parentObject: Contracts.Crypto.ITransactionData) => {
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

					return data === schema;
				};
			},
			errors: false,
			metaSchema: {
				minimum: 0,
				type: "integer",
			},
		});
	};

	const network = (ajv: Ajv) => {
		ajv.addKeyword("network", {
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
			metaSchema: {
				type: "boolean",
			},
		});
	};

	// @TODO: revisit the need for the genesis check
	const bignum = (ajv: Ajv) => {
		const instanceOf = ajvKeywords.get("instanceof").definition;
		instanceOf.CONSTRUCTORS.BigNumber = BigNumber;

		ajv.addKeyword("bignumber", {
			compile(schema) {
				return (data, dataPath, parentObject: any, property) => {
					const minimum = typeof schema.minimum !== "undefined" ? schema.minimum : 0;
					const maximum = typeof schema.maximum !== "undefined" ? schema.maximum : "9223372036854775807"; // 8 byte maximum

					if (data !== 0 && !data) {
						return false;
					}

					let bignum: BigNumber;
					try {
						bignum = BigNumber.make(data);
					} catch {
						return false;
					}

					// if (parentObject && property) {
					// 	parentObject[property] = bignum;
					// }

					if (bignum.isLessThan(minimum)) {
						if (bignum.isZero() && schema.bypassGenesis) {
							let bypassGenesis = false;
							if (parentObject.id) {
								// if (schema.block) {
								// 	bypassGenesis = parentObject.height === 1;
								// } else {
								bypassGenesis = isGenesisTransaction(configuration, parentObject.id);
								// }
							}
							return bypassGenesis;
						} else {
							return false;
						}
					}

					if (bignum.isGreaterThan(maximum)) {
						return false;
					}

					return true;
				};
			},
			errors: false,
			metaSchema: {
				additionalItems: false,
				properties: {
					// block: { type: "boolean" },
					bypassGenesis: { type: "boolean" },
					maximum: { type: "integer" },
					minimum: { type: "integer" },
				},
				type: "object",
			},
			modifying: true,
		});
	};

	// @TODO: plugins should register this rule
	const blockId = (ajv: Ajv) => {
		ajv.addKeyword("blockId", {
			compile(schema) {
				return (data, dataPath, parentObject: any) => {
					if (
						parentObject &&
						parentObject.height === 1 &&
						schema.allowNullWhenGenesis &&
						(!data || Number(data) === 0)
					) {
						return true;
					}

					if (typeof data !== "string") {
						return false;
					}

					return /^[\da-f]{64}$/i.test(data);
				};
			},
			errors: false,
			metaSchema: {
				additionalItems: false,
				properties: {
					allowNullWhenGenesis: { type: "boolean" },
					// isPreviousBlock: { type: "boolean" }, // TODO: Remove
				},
				type: "object",
			},
		});
	};

	return { bignum, blockId, maxBytes, network, transactionType };
};
