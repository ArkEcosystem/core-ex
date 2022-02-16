import Ajv from "ajv";

import { TransactionType } from "../enums";
import { ITransactionData } from "../interfaces";
import { configManager } from "../managers";
import { BigNumber, isGenesisTransaction } from "../utils";

const maxBytes = (ajv: Ajv) => {
    ajv.addKeyword({
        keyword: "maxBytes",
        type: "string",
        compile(schema, parentSchema) {
            return (data) => {
                if ((parentSchema as any).type !== "string") {
                    return false;
                }

                return Buffer.from(data, "utf8").byteLength <= schema;
            };
        },
        errors: false,
        metaSchema: {
            type: "integer",
            minimum: 0,
        },
    });
};

const transactionType = (ajv: Ajv) => {
    ajv.addKeyword({
        keyword: "transactionType",
        compile(schema) {
            return (data, dataCtx) => {
                const parentObject = <ITransactionData> dataCtx.parentData;

                // Impose dynamic multipayment limit based on milestone
                if (
                    data === TransactionType.MultiPayment &&
                    parentObject &&
                    (!parentObject.typeGroup || parentObject.typeGroup === 1)
                ) {
                    if (parentObject.asset && parentObject.asset.payments) {
                        const limit: number = configManager.getMilestone().multiPaymentLimit || 256;
                        return parentObject.asset.payments.length <= limit;
                    }
                }

                return data === schema;
            };
        },
        errors: false,
        metaSchema: {
            type: "integer",
            minimum: 0,
        },
    });
};

const network = (ajv: Ajv) => {
    ajv.addKeyword({
        keyword: "network",
        compile(schema) {
            return (data) => {
                return schema && data === configManager.get("network.pubKeyHash");
            };
        },
        errors: false,
        metaSchema: {
            type: "boolean",
        },
    });
};

const bignumber = (ajv: Ajv) => {
    const instanceOf = require("ajv-keywords/dist/definitions/instanceof");
    instanceOf.CONSTRUCTORS.BigNumber = BigNumber;

    ajv.addKeyword({
        keyword: "bignumber",
        compile(schema) {
            return (data, dataCtx) => {
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

                if (dataCtx.parentData && dataCtx.parentDataProperty) {
                    dataCtx.parentData[dataCtx.parentDataProperty] = bignum;
                }

                let bypassGenesis: boolean = false;
                if (schema.bypassGenesis) {
                    if (dataCtx.parentData.id) {
                        if (schema.block) {
                            bypassGenesis = dataCtx.parentData.height === 1;
                        } else {
                            bypassGenesis = isGenesisTransaction(dataCtx.parentData.id);
                        }
                    }
                }

                if (bignum.isLessThan(minimum) && !(bignum.isZero() && bypassGenesis)) {
                    return false;
                }

                if (bignum.isGreaterThan(maximum) && !bypassGenesis) {
                    return false;
                }

                return true;
            };
        },
        errors: false,
        modifying: true,
        metaSchema: {
            type: "object",
            properties: {
                minimum: { type: "integer" },
                maximum: { type: "integer" },
                bypassGenesis: { type: "boolean" },
                block: { type: "boolean" },
            },
        },
    });
};

const blockId = (ajv: Ajv) => {
    ajv.addKeyword({
        keyword: "blockId",
        compile(schema) {
            return (data, dataCtx) => {
                if (dataCtx.parentData && dataCtx.parentData.height === 1 && schema.allowNullWhenGenesis) {
                    if (!data || Number(data) === 0) {
                        return true;
                    }
                }

                if (typeof data !== "string") {
                    return false;
                }

                // Partial SHA256 block id (old/legacy), before the switch to full SHA256.
                // 8 byte integer either decimal without leading zeros or hex with leading zeros.
                const isPartial = /^[0-9]{1,20}$/.test(data) || /^[0-9a-f]{16}$/i.test(data);
                const isFullSha256 = /^[0-9a-f]{64}$/i.test(data);

                if (dataCtx.parentData && dataCtx.parentData.height) {
                    const height = schema.isPreviousBlock ? dataCtx.parentData.height - 1 : dataCtx.parentData.height;
                    const constants = configManager.getMilestone(height ?? 1); // if height === 0 set it to 1
                    return constants.block.idFullSha256 ? isFullSha256 : isPartial;
                }

                return isPartial || isFullSha256;
            };
        },
        errors: false,
        metaSchema: {
            type: "object",
            properties: {
                allowNullWhenGenesis: { type: "boolean" },
                isPreviousBlock: { type: "boolean" },
            },
        },
    });
};

export const keywords = [bignumber, blockId, maxBytes, network, transactionType];
