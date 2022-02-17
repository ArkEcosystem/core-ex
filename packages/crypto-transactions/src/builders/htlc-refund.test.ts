import "jest-extended";

import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../../test";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { TransactionType } from "../enums";
import { InternalTransactionType } from "../types";
import { HtlcRefundTransaction } from "../types/two";
import { HtlcRefundBuilder } from "./htlc-refund";

let builder: HtlcRefundBuilder;
let configManager: ConfigManager;
let builderFactory: TransactionBuilderFactory;

beforeEach(() => {
    const typesMap = new Map();
    const internalType: InternalTransactionType = InternalTransactionType.from(
        HtlcRefundTransaction.type,
        HtlcRefundTransaction.typeGroup,
    );
    typesMap.set(internalType, new Map().set(HtlcRefundTransaction.version, HtlcRefundTransaction));

    const services = createServices("testnet");
    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
});

describe("Htlc refund Transaction", () => {
    beforeEach(() => {
        builder = builderFactory.htlcRefund();
    });

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.HtlcRefund);
        //expect(builder).toHaveProperty("data.fee", Two.HtlcRefundTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", BigNumber.make(0));
        expect(builder).toHaveProperty("data.asset", {});
    });

    describe("htlcRefundAsset", () => {
        it("should set the htlc refund asset", () => {
            const htlcRefundAsset = {
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            };

            builder.htlcRefundAsset(htlcRefundAsset);

            expect(builder.data.asset!.refund).toEqual(htlcRefundAsset);
        });
    });

    describe("verify", () => {
        const htlcRefundAsset = {
            lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
        };

        it("should be valid with a signature", () => {
            const actual = builder.htlcRefundAsset(htlcRefundAsset).sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .htlcRefundAsset(htlcRefundAsset)
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
