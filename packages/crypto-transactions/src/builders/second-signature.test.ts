import "jest-extended";

import { Keys } from "@arkecosystem/crypto-identities";
import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../../test";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { TransactionType } from "../enums";
import { InternalTransactionType, Two } from "../types";
import { SecondSignatureRegistrationTransaction } from "../types/one";
import { SecondSignatureBuilder } from "./second-signature";

let builder: SecondSignatureBuilder;
let configManager: ConfigManager;
let builderFactory: TransactionBuilderFactory;

beforeEach(() => {
    const typesMap = new Map();
    const internalType: InternalTransactionType = InternalTransactionType.from(
        SecondSignatureRegistrationTransaction.type,
        SecondSignatureRegistrationTransaction.typeGroup,
    );
    typesMap.set(
        internalType,
        new Map().set(SecondSignatureRegistrationTransaction.version, SecondSignatureRegistrationTransaction),
    );

    const services = createServices("testnet");
    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
});

beforeEach(() => (builder = builderFactory.secondSignature()));

describe("Second Signature Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder.signatureAsset("signature").sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.SecondSignature);
        //expect(builder).toHaveProperty("data.fee", Two.SecondSignatureRegistrationTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.signature", {});
    });

    describe("signatureAsset", () => {
        it("establishes the signature on the asset", () => {
            const keys = {
                compressed: true,
                privateKey: "e636820f8c1ec832183dd0296d1ddc1a92d832bda465dd7833a191ddd12444d6",
                publicKey: "031ed910ce80697b58209c5aff9c3de7e2949a03a3ce3daae653dffd9f63189d01",
            };
            jest.spyOn(Keys, "fromPassphrase").mockReturnValueOnce(keys);

            builder.signatureAsset("a second passphrase");

            expect(builder.data.asset!.signature!.publicKey).toBe(keys.publicKey);
        });
    });
});
