import "jest-extended";

import { Address, Keys } from "@arkecosystem/crypto-identities";

import { createServices } from "../test";
import { createRandomTx } from "../test/support/transactions";
import { Hash } from "./crypto";
import { TransactionVersionError } from "./errors";

let verifier, builderFactory, config, helpers;

const setup = (network: string) => {
    const services = createServices(network);
    verifier = services.verifier;
    builderFactory = services.builderFactory;
    config = services.config;
    helpers = services.helpers;

    config.setHeight(2); // v2 transactions
};
setup("testnet");

beforeEach(() => {
    setup("testnet");
});

describe("verifier", () => {
    describe("verify", () => {
        const transaction = builderFactory
            .transfer()
            .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
            .amount("1000")
            .version(2)
            .fee("2000")
            .nonce("1")
            .vendorField("Test Transaction 1")
            .sign("secret")
            .getStruct();

        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            expect(verifier.verifyHash(transaction)).toBeTrue();
        });

        it("should return false on an invalid signature", () => {
            expect(
                verifier.verifyHash(Object.assign({}, transaction, { senderPublicKey: otherPublicKey })),
            ).toBeFalse();
        });

        it("should return false on a missing signature", () => {
            const transactionWithoutSignature = Object.assign({}, transaction);
            delete transactionWithoutSignature.signature;

            expect(verifier.verifyHash(transactionWithoutSignature)).toBeFalse();
        });

        it("should verify ECDSA signature for a version 2 transaction", () => {
            const keys = Keys.fromPassphrase("secret");
            const { data }: any = builderFactory
                .transfer()
                .senderPublicKey(keys.publicKey)
                .recipientId(Address.fromPublicKey(keys.publicKey, { pubKeyHash: 23 }))
                .version(2)
                .fee("10")
                .amount("100");

            const hash = helpers.toHash(data);
            data.signature = Hash.signECDSA(hash, keys);

            expect(verifier.verify(data)).toBeTrue();
        });

        // Test each type on it's own
        describe.each([0, 1, 2, 3])("type %s", (type) => {
            it("should be ok", () => {
                const tx = createRandomTx(type, builderFactory, config);
                expect(tx.verify()).toBeTrue();
            });
        });

        describe("type 4", () => {
            it("should return false if AIP11 is not activated", () => {
                const tx = createRandomTx(4, builderFactory, config);
                config.getMilestone().aip11 = false;
                expect(tx.verify()).toBeFalse();
            });

            it("should return true if AIP11 is activated", () => {
                const tx = createRandomTx(4, builderFactory, config);
                config.getMilestone().aip11 = true;
                expect(tx.verify()).toBeTrue();
                config.getMilestone().aip11 = false;
            });
        });
    });

    describe("verifySecondSignature", () => {
        const keys2 = Keys.fromPassphrase("secret two");

        const transaction = builderFactory
            .transfer()
            .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
            .amount("1000")
            .version(2)
            .fee("2000")
            .nonce("1")
            .vendorField("Test Transaction 1")
            .sign("secret")
            .secondSign("secret two")
            .getStruct();

        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            config.getMilestone().aip11 = true;
            expect(verifier.verifySecondSignature(transaction, keys2.publicKey)).toBeTrue();
        });

        it("should return false on an invalid second signature", () => {
            expect(verifier.verifySecondSignature(transaction, otherPublicKey)).toBeFalse();
        });

        it("should return false on a missing second signature", () => {
            const transactionWithoutSignature = Object.assign({}, transaction);
            delete transactionWithoutSignature.secondSignature;
            delete transactionWithoutSignature.signSignature;

            expect(verifier.verifySecondSignature(transactionWithoutSignature, keys2.publicKey)).toBeFalse();
        });

        it("should fail this.getHash for transaction version > 1", () => {
            const transactionV2 = Object.assign({}, transaction, { version: 2 });
            config.getMilestone().aip11 = false;

            expect(() => verifier.verifySecondSignature(transactionV2, keys2.publicKey)).toThrow(
                TransactionVersionError,
            );

            config.getMilestone().aip11 = true;
        });
    });
});
