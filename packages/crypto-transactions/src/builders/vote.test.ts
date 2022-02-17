import "jest-extended";

import { Keys } from "@arkecosystem/crypto-identities";
import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../../test";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { TransactionType } from "../enums";
import { Helpers } from "../helpers";
import { InternalTransactionType } from "../types";
import { VoteTransaction } from "../types/one";
import { VoteBuilder } from "./vote";

let builder: VoteBuilder;
let configManager: ConfigManager;
let helpers: Helpers;
let builderFactory: TransactionBuilderFactory;

beforeEach(() => {
    const typesMap = new Map();
    const internalType: InternalTransactionType = InternalTransactionType.from(
        VoteTransaction.type,
        VoteTransaction.typeGroup,
    );
    typesMap.set(internalType, new Map().set(VoteTransaction.version, VoteTransaction));

    const services = createServices("testnet");
    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
});

beforeEach(() => (builder = builderFactory.vote()));

describe("Vote Transaction", () => {
    const identity = {
        address: "ANCAcdEc9Yrh1akXtCD7RCcrB7XLbT6JgZ",
        keys: {
            compressed: true,
            privateKey: "e636820f8c1ec832183dd0296d1ddc1a92d832bda465dd7833a191ddd12444d6",
            publicKey: "031ed910ce80697b58209c5aff9c3de7e2949a03a3ce3daae653dffd9f63189d01",
        },
        bip39: "some passphrase",
        wif: "SHHhRM21LgYFg4gg9uzk4G6CV2j1u7XiTaQiT2Udxr1P8XvyGCHH",
    };

    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder
                .votesAsset(["+02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af"])
                .sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .votesAsset(["+02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af"])
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.Vote);
        //expect(builder).toHaveProperty("data.fee", Two.VoteTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.votes", []);
    });

    describe("votesAsset", () => {
        it("establishes the votes asset", () => {
            const votes = ["+dummy-1"];
            builder.votesAsset(votes);
            expect(builder.data.asset!.votes).toBe(votes);
        });
    });

    describe("sign", () => {
        it("establishes the recipient id", () => {
            jest.spyOn(Keys, "fromPassphrase").mockReturnValueOnce(identity.keys);

            builder.network(23).sign(identity.bip39);

            expect(builder.data.recipientId).toBe(identity.address);
        });
    });

    describe("signWithWif", () => {
        it("establishes the recipient id", () => {
            jest.spyOn(Keys, "fromWIF").mockReturnValueOnce(identity.keys);

            builder.network(23).signWithWif(identity.wif, 186);
            expect(builder.data.recipientId).toBe(identity.address);
        });
    });
});
