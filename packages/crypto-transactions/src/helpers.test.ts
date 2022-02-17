import "jest-extended";

import { Keys } from "@arkecosystem/crypto-identities";
import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../test";
import { transaction as transactionDataFixture } from "../test/fixtures/transaction";
import { ITransaction, ITransactionData } from "./contracts";
import { InvalidTransactionBytesError, TransactionTypeError, TransactionVersionError } from "./errors";
import { Transaction } from "./types";

let transactionData: ITransactionData;
let transactionDataJSON;

let verifier, builderFactory, serializer, deserializer, factory, config, helpers;

const setup = (network: string) => {
    const services = createServices(network);
    verifier = services.verifier;
    builderFactory = services.builderFactory;
    serializer = services.serializer;
    deserializer = services.deserializer;
    factory = services.factory;
    config = services.config;
    helpers = services.helpers;

    config.setHeight(2); // v2 transactions
};
setup("devnet");

const createRandomTx = (type) => {
    let transaction: ITransaction;

    switch (type) {
        case 0: {
            // transfer
            transaction = builderFactory
                .transfer()
                .version(2)
                .recipientId("DJLxkgm7JMortrGVh1ZrvDH39XALWLa83e")
                .amount("10000000000000")
                .vendorField(Math.random().toString(36))
                .sign(Math.random().toString(36))
                .secondSign(Math.random().toString(36))
                .build();
            break;
        }

        case 1: {
            // second signature
            transaction = builderFactory
                .secondSignature()
                .signatureAsset(Math.random().toString(36))
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 2: {
            // delegate registration
            transaction = builderFactory
                .delegateRegistration()
                .usernameAsset("dummydelegate")
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 3: {
            // vote registration
            transaction = builderFactory
                .vote()
                .network(30)
                .votesAsset(["+036928c98ee53a1f52ed01dd87db10ffe1980eb47cd7c0a7d688321f47b5d7d760"])
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 4: {
            config.getMilestone().aip11 = true;
            const passphrases = [Math.random().toString(36), Math.random().toString(36), Math.random().toString(36)];

            const participants = passphrases.map((passphrase) => {
                return Keys.fromPassphrase(passphrase);
            });

            const min = Math.min(1, participants.length);
            const max = Math.max(1, participants.length);

            const multiSigRegistration = builderFactory
                .multiSignature()
                .min(Math.floor(Math.random() * (max - min)) + min);

            participants.forEach((participant) => {
                multiSigRegistration.participant(participant.publicKey);
            });

            multiSigRegistration.senderPublicKey(participants[0].publicKey);

            passphrases.forEach((passphrase, index) => {
                multiSigRegistration.multiSign(passphrase, index);
            });

            transaction = multiSigRegistration.sign(passphrases[0]).build();

            config.getMilestone().aip11 = false;
            break;
        }
        default: {
            throw new TransactionTypeError(type);
        }
    }

    return transaction;
};

describe("Transaction", () => {
    beforeEach(() => {
        setup("devnet");

        transactionData = { ...transactionDataFixture };
        transactionDataJSON = {
            ...transactionData,
            ...{ amount: transactionData.amount.toFixed(), fee: transactionData.fee.toFixed() },
        };
    });

    describe("toBytes / fromBytes", () => {
        it("should verify all transactions", () => {
            config.setHeight(4008000);
            [0, 1, 2, 3]
                .map((type) => createRandomTx(type))
                .forEach((transaction) => {
                    const newTransaction = factory.fromBytes(helpers.toBytes(transaction.data));

                    // TODO: Remove both from data when not needed
                    delete transaction.data.signSignature;
                    if (transaction.data.recipientId === undefined) {
                        delete transaction.data.recipientId;
                    }

                    // @TODO: double check
                    if (!transaction.data.secondSignature) {
                        delete transaction.data.secondSignature;
                    }

                    if (transaction.data.version === 1) {
                        delete transaction.data.typeGroup;
                        delete transaction.data.nonce;
                    }

                    // @ts-ignore
                    transaction.data.amount = BigNumber.make(transaction.data.amount).toFixed();
                    // @ts-ignore
                    transaction.data.fee = BigNumber.make(transaction.data.fee).toFixed();
                    // @ts-ignore
                    transaction.data.nonce = BigNumber.make(transaction.data.nonce).toFixed();

                    expect(newTransaction.toJson()).toMatchObject(transaction.data);
                    expect(newTransaction.verified).toBeTrue();
                });
        });

        it("should create a transaction", () => {
            const hex = helpers.toBytes(transactionData).toString("hex");
            const transaction = factory.fromHex(hex);
            expect(transaction).toBeInstanceOf(Transaction);
            expect(transaction.toJson()).toEqual(transactionDataJSON);
        });

        it("should throw when getting garbage", () => {
            expect(() => factory.fromBytes(undefined)).toThrow(TypeError);
            expect(() => factory.fromBytes(Buffer.from("garbage"))).toThrow(InvalidTransactionBytesError);
            expect(() => factory.fromHex(undefined)).toThrow(InvalidTransactionBytesError);
            expect(() => factory.fromHex("affe")).toThrow(InvalidTransactionBytesError);
        });

        it("should throw when getting an unsupported version", () => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            setup("testnet");

            const transaction = builderFactory
                .transfer()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("1000")
                .vendorField(Math.random().toString(36))
                .nonce("1")
                .sign(Math.random().toString(36))
                .secondSign(Math.random().toString(36))
                .build();

            let hex = transaction.serialized.toString("hex");
            hex = hex.slice(0, 2) + "04" + hex.slice(4);
            expect(() => factory.fromHex(hex)).toThrow(TransactionVersionError);

            setup("devnet");
        });
    });

    describe("getHash", () => {
        let transaction: ITransactionData;

        beforeEach(() => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            setup("testnet");

            transaction = builderFactory
                .transfer()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .version(2)
                .amount("1000")
                .fee("2000")
                .nonce("1")
                .vendorField("Test Transaction 1")
                .sign("secret")
                .getStruct();
        });

        it("should return Buffer and Buffer most be 32 bytes length", () => {
            const result = helpers.toHash(transaction);
            expect(result).toBeObject();
            expect(result).toHaveLength(32);
            expect(result.toString("hex")).toBe("27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c");
        });

        it("should throw for unsupported versions", () => {
            expect(() => helpers.toHash(Object.assign({}, transaction, { version: 110 }))).toThrow(
                TransactionVersionError,
            );
        });
    });

    describe("getId", () => {
        let transaction: ITransactionData;

        beforeEach(() => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            setup("testnet");

            transaction = builderFactory
                .transfer()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("1000")
                .version(2)
                .fee("2000")
                .nonce("1")
                .vendorField("Test Transaction 1")
                .sign("secret")
                .getStruct();
        });

        it("should return string id and be equal to 27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c", () => {
            const id = helpers.getId(transaction); // old id
            expect(id).toBeString();
            expect(id).toBe("27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c");
        });

        it("should throw for unsupported version", () => {
            expect(() => helpers.getId(Object.assign({}, transaction, { version: 110 }))).toThrow(
                TransactionVersionError,
            );
        });
    });
});
