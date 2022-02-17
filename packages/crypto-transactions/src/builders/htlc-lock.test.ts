import "jest-extended";

import { createServices } from "../../test";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { HtlcLockExpirationType, TransactionType } from "../enums";
import { Helpers } from "../helpers";
import { InternalTransactionType } from "../types";
import { HtlcLockTransaction } from "../types/two";
import { HtlcLockBuilder } from "./htlc-lock";

const { EpochTimestamp } = HtlcLockExpirationType;
let builder: HtlcLockBuilder;
let configManager: ConfigManager;
let builderFactory: TransactionBuilderFactory;

beforeEach(() => {
    const typesMap = new Map();
    const internalType: InternalTransactionType = InternalTransactionType.from(
        HtlcLockTransaction.type,
        HtlcLockTransaction.typeGroup,
    );
    typesMap.set(internalType, new Map().set(HtlcLockTransaction.version, HtlcLockTransaction));

    const services = createServices("testnet");
    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
});

describe("Htlc lock Transaction", () => {
    beforeEach(() => {
        builder = builderFactory.htlcLock();
    });
    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.HtlcLock);
        //expect(builder).toHaveProperty("data.fee", Two.HtlcLockTransaction.staticFee());
        expect(builder).toHaveProperty("data.asset", {});
    });

    describe("htlcLockAsset", () => {
        it("should set the htlc lock asset", () => {
            const htlcLockAsset = {
                secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
                expiration: {
                    type: EpochTimestamp,
                    value: Math.floor(Date.now() / 1000),
                },
            };

            builder.htlcLockAsset(htlcLockAsset);

            expect(builder.data.asset!.lock).toEqual(htlcLockAsset);
        });
    });

    describe("verify", () => {
        const htlcLockAsset = {
            secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
            expiration: {
                type: EpochTimestamp,
                value: Math.floor(Date.now() / 1000),
            },
        };
        const address = "AVzsSFwicz5gYLqCzZNL8N1RztkWQSMovK";

        it("should be valid with a signature", () => {
            const actual = builder
                .recipientId(address)
                .htlcLockAsset(htlcLockAsset)
                .amount("1")
                .sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .recipientId(address)
                .htlcLockAsset(htlcLockAsset)
                .amount("1")
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
