import "jest-extended";

import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../../test";
import { htlcSecretHex } from "../../test/fixtures/transactions/htlc";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { TransactionType } from "../enums";
import { InternalTransactionType } from "../types";
import { HtlcClaimTransaction } from "../types/two";
import { HtlcClaimBuilder } from "./htlc-claim";

let builder: HtlcClaimBuilder;
let configManager: ConfigManager;
let builderFactory: TransactionBuilderFactory;

beforeEach(() => {
    const typesMap = new Map();
    const internalType: InternalTransactionType = InternalTransactionType.from(
        HtlcClaimTransaction.type,
        HtlcClaimTransaction.typeGroup,
    );
    typesMap.set(internalType, new Map().set(HtlcClaimTransaction.version, HtlcClaimTransaction));

    const services = createServices("testnet");
    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
});

describe("Htlc claim Transaction", () => {
    beforeEach(() => {
        builder = builderFactory.htlcClaim();
    });

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.HtlcClaim);
        //expect(builder).toHaveProperty("data.fee", Two.HtlcClaimTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", BigNumber.make(0));
        expect(builder).toHaveProperty("data.asset", {});
    });

    describe("htlcClaimAsset", () => {
        it("should set the htlc claim asset", () => {
            const htlcClaimAsset = {
                lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                unlockSecret: htlcSecretHex,
            };

            builder.htlcClaimAsset(htlcClaimAsset);

            expect(builder.data.asset!.claim).toEqual(htlcClaimAsset);
        });
    });

    describe("verify", () => {
        const htlcClaimAsset = {
            lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            unlockSecret: htlcSecretHex,
        };

        it("should be valid with a signature", () => {
            const actual = builder.htlcClaimAsset(htlcClaimAsset).sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .htlcClaimAsset(htlcClaimAsset)
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
