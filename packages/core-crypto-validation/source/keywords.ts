// @ts-nocheck
import { Contracts } from "@arkecosystem/core-contracts";
import { BigNumber } from "@arkecosystem/utils";
import Ajv, { AnySchemaObject } from "ajv";

let genesisTransactions;

const isGenesisTransaction = (configuration: Contracts.Crypto.IConfiguration, id: string) => {
	if (!configuration.get("genesisBlock.transactions")) {
		return true;
	}

	if (!genesisTransactions) {
		genesisTransactions = Object.fromEntries(
			configuration.get("genesisBlock.transactions").map((current) => [current.id, true]),
		);
	}

	return !!genesisTransactions[id];
};

export const registerKeywords = (configuration: Contracts.Crypto.IConfiguration) => {
	const maxBytes = (ajv: Ajv) => {
		ajv.addKeyword({
			compile(schema, parentSchema) {
				return (data) =>
					// if ((parentSchema as any).type !== "string") {
					// 	return false;
					// }

					Buffer.from(data, "utf8").byteLength <= schema;
			},
			errors: false,
			keyword: "maxBytes",
			metaSchema: {
				minimum: 0,
				type: "integer",
			},
			type: "string",
		});
	};

	const transactionType = (ajv: Ajv) => {
		ajv.addKeyword({
			// @ts-ignore
			compile(schema) {
				return (data, dataPath, parentObject: Contracts.Crypto.ITransactionData) =>
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
		});
	};

	const network = (ajv: Ajv) => {
		ajv.addKeyword({
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
		});
	};

	// @TODO: revisit the need for the genesis check
	const bignum = (ajv: Ajv) => {
		// const instanceOf = ajvKeywords.get("instanceof").definition;
		// instanceOf.CONSTRUCTORS.BigNumber = BigNumber;

		ajv.addKeyword({
			compile(schema) {
				return (data, parentSchema: AnySchemaObject) => {
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
						if (bignum.isZero() && schema.bypassGenesis && parentSchema.parentData?.id) {
							let bypassGenesis = false;
							// if (parentObject.id) {
							// if (schema.block) {
							// 	bypassGenesis = parentObject.height === 1;
							// } else {
							bypassGenesis = isGenesisTransaction(configuration, parentSchema.parentData.id);
							// }
							// }
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
			keyword: "bignumber",
			metaSchema: {
				// additionalItems: false,
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
		ajv.addKeyword({
			compile(schema) {
				return (data, parentSchema: AnySchemaObject) => {
					if (
						parentSchema.parentData?.height === 1 &&
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
			keyword: "blockId",
			metaSchema: {
				// additionalItems: false,
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
