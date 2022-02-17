import "jest-extended";

import { Keys, WIF } from "@arkecosystem/crypto-identities";
import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../../test";
import { testnet } from "../../test/networks/testnet";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { TransactionType } from "../enums";
import { Helpers } from "../helpers";
import { InternalTransactionType } from "../types";
import { TransferTransaction } from "../types/one";
import { TransferBuilder } from "./transfer";

let builder: TransferBuilder;
let configManager: ConfigManager;
let helpers: Helpers;
let builderFactory: TransactionBuilderFactory;

beforeEach(() => {
    const typesMap = new Map();
    const internalType: InternalTransactionType = InternalTransactionType.from(
        TransferTransaction.type,
        TransferTransaction.typeGroup,
    );
    typesMap.set(internalType, new Map().set(TransferTransaction.version, TransferTransaction));

    const services = createServices("testnet");
    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
});

beforeEach(() => (builder = builderFactory.transfer()));

describe("Transfer Transaction", () => {
    const identity = { address: "ASQTYqivLXd2iJCZSFQ2SdbN8BTUryX5zh" };
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder
                .recipientId(identity.address)
                .amount("1")
                .vendorField("dummy")
                .sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .recipientId(identity.address)
                .amount("1")
                .vendorField("dummy")
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("signWithWif", () => {
        it("should sign a transaction and match signed with a passphrase", () => {
            const passphrase = "sample passphrase";
            const keys = Keys.fromPassphrase(passphrase);
            const wif = WIF.fromKeys(keys, testnet.network);

            const wifTransaction = builder.recipientId(identity.address).amount("10").fee("10");

            const passphraseTransaction = builderFactory.transfer();
            passphraseTransaction.data = { ...wifTransaction.data };

            wifTransaction.signWithWif(wif, 186);
            passphraseTransaction.sign(passphrase);

            expect(wifTransaction.data.signature).toBe(passphraseTransaction.data.signature);
        });
    });

    describe("secondSignWithWif", () => {
        it("should sign a transaction and match signed with a passphrase", () => {
            const passphrase = "first passphrase";
            const secondPassphrase = "second passphrase";
            const keys = Keys.fromPassphrase(secondPassphrase);
            const wif = WIF.fromKeys(keys, testnet.network);

            const wifTransaction = builder.recipientId(identity.address).amount("10").fee("10").sign(passphrase);

            const passphraseTransaction = builderFactory.transfer();
            passphraseTransaction.data = { ...wifTransaction.data };

            wifTransaction.secondSignWithWif(wif, 186);
            passphraseTransaction.secondSign(secondPassphrase);

            expect(wifTransaction.data.secondSignature).toBe(passphraseTransaction.data.secondSignature);
        });
    });

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.Transfer);
        //expect(builder).toHaveProperty("data.fee", Two.TransferTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.expiration", 0);
    });

    describe("vendorField", () => {
        it("should set the vendorField", () => {
            builder.vendorField("fake");
            expect(builder.data.vendorField).toBe("fake");
        });
    });
});
