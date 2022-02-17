import "jest-extended";

import { Keys } from "@arkecosystem/crypto-identities";

import { createServices } from "../test";
import { TransactionVersionError } from "./errors";

let builderFactory, config, signer;

const setup = (network: string) => {
    const services = createServices(network);
    builderFactory = services.builderFactory;
    config = services.config;
    signer = services.signer;

    config.setHeight(2); // v2 transactions
};
setup("testnet");

beforeEach(() => {
    setup("testnet");
});

describe("signer", () => {
    describe("sign", () => {
        const keys = Keys.fromPassphrase("secret");
        const transaction = builderFactory
            .transfer()
            .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
            .version(2)
            .amount("1000")
            .fee("2000")
            .vendorField("Test Transaction 1")
            .nonce("1")
            .sign("secret")
            .getStruct();

        it("should return a valid signature", () => {
            const signature = signer.sign(transaction, keys);
            expect(signature).toBe(
                "b12442fa9a692ba0a2b76492a584a07a5e715891d58f5c1f11255af47544164b1f6a038a319074e5edc5336bd412eca4b54ebf27f39a76b18a14e92fbcdb2084",
            );
        });

        it("should throw for unsupported versions", () => {
            expect(() => {
                signer.sign(Object.assign({}, transaction, { version: 110 }), keys);
            }).toThrow(TransactionVersionError);
        });

        it("should sign version 2 if aip11 milestone is true", () => {
            config.getMilestone().aip11 = false;

            expect(() => {
                signer.sign(Object.assign({}, transaction, { version: 2 }), keys);
            }).toThrow(TransactionVersionError);

            config.getMilestone().aip11 = true;

            expect(() => {
                signer.sign(Object.assign({}, transaction, { version: 2 }), keys);
            }).not.toThrow(TransactionVersionError);
        });
    });
});
