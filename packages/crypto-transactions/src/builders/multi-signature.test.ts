import "jest-extended";

import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../../test";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { TransactionType } from "../enums";
import { TransactionVersionError } from "../errors";
import { InternalTransactionType } from "../types";
import { MultiSignatureRegistrationTransaction } from "../types/two";
import { MultiSignatureBuilder } from "./multi-signature";

let builder: MultiSignatureBuilder;
let configManager: ConfigManager;
let builderFactory: TransactionBuilderFactory;

beforeEach(() => {
    const typesMap = new Map();
    const internalType: InternalTransactionType = InternalTransactionType.from(
        MultiSignatureRegistrationTransaction.type,
        MultiSignatureRegistrationTransaction.typeGroup,
    );
    typesMap.set(
        internalType,
        new Map().set(MultiSignatureRegistrationTransaction.version, MultiSignatureRegistrationTransaction),
    );

    const services = createServices("testnet");
    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
});

describe("Multi Signature Transaction", () => {
    beforeEach(() => {
        builder = builderFactory.multiSignature();
    });

    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder
                .multiSignatureAsset({
                    publicKeys: [
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                        "028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0",
                        "021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd",
                    ],
                    min: 2,
                })
                .senderPublicKey("039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22")
                .multiSign("secret 1", 0)
                .multiSign("secret 2", 1)
                .multiSign("secret 3", 2)
                .sign("secret 1");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be invalid when aip11 is not active", () => {
            configManager.getMilestone().aip11 = false;
            const actual = builder
                .multiSignatureAsset({
                    publicKeys: [
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                        "028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0",
                        "021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd",
                    ],
                    min: 2,
                })
                .senderPublicKey("039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22");

            expect(() => actual.multiSign("secret 1", 0)).toThrowError(TransactionVersionError);
            configManager.getMilestone().aip11 = true;
        });
    });

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.MultiSignature);
        expect(builder).toHaveProperty("data.version", 0x02);
        expect(builder).toHaveProperty("data.fee", BigNumber.make(0));
        expect(builder).toHaveProperty("data.amount", BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.multiSignature", { min: 0, publicKeys: [] });
    });

    describe("multiSignatureAsset", () => {
        const multiSignature = {
            publicKeys: ["key a", "key b", "key c"],
            min: 1,
        };

        it("establishes the multi-signature on the asset", () => {
            builder.multiSignatureAsset(multiSignature);
            expect(builder.data.asset!.multiSignature).toBe(multiSignature);
        });
    });

    describe("multiSign", () => {
        it("adds the signature to the transaction", () => {
            const actual = builder
                .multiSignatureAsset({
                    publicKeys: [
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                        "028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0",
                        "021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd",
                    ],
                    min: 2,
                })
                .senderPublicKey("039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22")
                .nonce("1");

            actual.multiSign("secret 1", 0).multiSign("secret 2", 1).multiSign("secret 3", 2);

            expect(actual.data.signatures).toEqual([
                "009fe6ca3b83a9a5e693fecb2b184900c5135a8c07e704c473b2f19117630f840428416f583f1a24ff371ba7e6fbca9a7fb796226ef9ef6542f44ed911951ac88d",
                "0116779a98b2009b35d4003dda7628e46365f1a52068489bfbd80594770967a3949f76bc09e204eddd7d460e1e519b826c53dc6e2c9573096326dbc495050cf292",
                "02687bd0f4a91be39daf648a5b1e1af5ffa4a3d4319b2e38b1fc2dc206db03f542f3b26c4803e0b4c8a53ddfb6cf4533b512d71ae869d4e4ccba989c4a4222396b",
            ]);
            expect(actual.data.signatures!.length).toBe(3);
        });
    });
});
