import "jest-extended";

import { Address, Keys, PublicKey } from "@arkecosystem/crypto-identities";
import { BigNumber } from "@arkecosystem/utils";
import ByteBuffer from "bytebuffer";

import { createServices } from "../test";
import { htlcSecretHashHex, htlcSecretHex } from "../test/fixtures/transactions/htlc";
import { legacyMultiSignatureRegistration } from "../test/fixtures/transactions/transaction";
import { ITransaction, ITransactionData } from "./contracts";
import { Hash } from "./crypto";
import { HtlcLockExpirationType, TransactionTypeGroup } from "./enums";
import {
    InvalidTransactionBytesError,
    MaximumPaymentCountExceededError,
    TransactionSchemaError,
    TransactionVersionError,
    UnkownTransactionError,
} from "./errors";

let verifier, builderFactory, serializer, deserializer, factory, config, helpers;

const setup = () => {
    const services = createServices("testnet");
    verifier = services.verifier;
    builderFactory = services.builderFactory;
    serializer = services.serializer;
    deserializer = services.deserializer;
    factory = services.factory;
    config = services.config;
    helpers = services.helpers;

    config.setHeight(2); // v2 transactions
};
setup();

describe("Transaction serializer / deserializer", () => {
    const checkCommonFields = (deserialized: ITransaction, expected) => {
        const fieldsToCheck = ["version", "network", "type", "senderPublicKey", "fee", "amount"];
        if (deserialized.data.version === 1) {
            fieldsToCheck.push("timestamp");
        } else {
            fieldsToCheck.push("typeGroup");
            fieldsToCheck.push("nonce");
        }

        for (const field of fieldsToCheck) {
            expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
        }

        expect(verifier.verify(deserialized.data)).toBeTrue();
    };

    describe("ser/deserialize - transfer", () => {
        const transfer = builderFactory
            .transfer()
            .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
            .amount("10000")
            .fee("50000000")
            .vendorField("cool vendor field")
            .network(23)
            .sign("dummy passphrase")
            .getStruct();

        it("should ser/deserialize giving back original fields", () => {
            const serialized = factory.fromData(transfer).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, transfer);

            expect(deserialized.data.vendorField).toBe(transfer.vendorField);
            expect(deserialized.data.recipientId).toBe(transfer.recipientId);
        });

        it("should ser/deserialize with long vendorfield when vendorFieldLength=255 milestone is active", () => {
            config.getMilestone().vendorFieldLength = 255;

            const transferWithLongVendorfield = builderFactory
                .transfer()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("10000")
                .fee("50000000")
                .vendorField("y".repeat(255))
                .network(23)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = helpers.toBytes(transferWithLongVendorfield);
            const deserialized = factory.fromBytes(serialized);

            expect(deserialized.verified).toBeTrue();
            expect(deserialized.data.vendorField).toHaveLength(255);
            expect(deserialized.data.vendorField).toEqual("y".repeat(255));

            config.getMilestone().vendorFieldLength = 64;
        });

        it("should not ser/deserialize long vendorfield when vendorFieldLength=255 milestone is not active", () => {
            const transferWithLongVendorfield = builderFactory
                .transfer()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("10000")
                .fee("50000000")
                .network(23)
                .sign("dummy passphrase")
                .getStruct();

            transferWithLongVendorfield.vendorField = "y".repeat(255);
            expect(() => {
                const serialized = helpers.toBytes(transferWithLongVendorfield);
                factory.fromBytes(serialized);
            }).toThrow(TransactionSchemaError);
        });
    });

    describe("ser/deserialize - second signature", () => {
        it("should ser/deserialize giving back original fields", () => {
            const secondSignature = builderFactory
                .secondSignature()
                .signatureAsset("signature")
                .fee("50000000")
                .network(23)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = factory.fromData(secondSignature).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, secondSignature);

            expect(deserialized.data.asset).toEqual(secondSignature.asset);
        });
    });

    describe("ser/deserialize - delegate registration", () => {
        it("should ser/deserialize giving back original fields", () => {
            const delegateRegistration = builderFactory
                .delegateRegistration()
                .usernameAsset("homer")
                .network(23)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = factory.fromData(delegateRegistration).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, delegateRegistration);

            expect(deserialized.data.asset).toEqual(delegateRegistration.asset);
        });
    });

    describe("ser/deserialize - vote", () => {
        it("should ser/deserialize giving back original fields", () => {
            const vote = builderFactory
                .vote()
                .votesAsset(["+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"])
                .fee("50000000")
                .network(23)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = factory.fromData(vote).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, vote);

            expect(deserialized.data.asset).toEqual(vote.asset);
        });
    });

    describe("ser/deserialize - multi signature (LEGACY)", () => {
        it.skip("should ser/deserialize a legacy multisig registration", () => {
            const deserialized = factory.fromHex(legacyMultiSignatureRegistration.serialized);

            expect(deserialized.id).toEqual(legacyMultiSignatureRegistration.data.id);
            expect(deserialized.toJson()).toMatchObject(legacyMultiSignatureRegistration.data);
        });
    });

    describe("ser/deserialize - multi signature", () => {
        let multiSignatureRegistration;

        beforeEach(() => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            setup();

            const participant1 = Keys.fromPassphrase("secret 1");
            const participant2 = Keys.fromPassphrase("secret 2");
            const participant3 = Keys.fromPassphrase("secret 3");

            multiSignatureRegistration = builderFactory
                .multiSignature()
                .senderPublicKey(participant1.publicKey)
                .network(23)
                .participant(participant1.publicKey)
                .participant(participant2.publicKey)
                .participant(participant3.publicKey)
                .min(3)
                .multiSign("secret 1", 0)
                .multiSign("secret 2", 1)
                .multiSign("secret 3", 2)
                .sign("secret 1")
                .getStruct();
        });

        it("should ser/deserialize a multisig registration", () => {
            const transaction = factory.fromData(multiSignatureRegistration);
            const deserialized = factory.fromBytes(transaction.serialized);

            expect(transaction.isVerified).toBeTrue();
            expect(deserialized.isVerified).toBeTrue();
            expect(deserialized.data.asset).toEqual(multiSignatureRegistration.asset);
            expect(transaction.data.signatures).toEqual(deserialized.data.signatures);
            checkCommonFields(deserialized, multiSignatureRegistration);
        });

        it("should fail to verify", () => {
            const transaction = factory.fromData(multiSignatureRegistration);
            config.getMilestone().aip11 = false;
            expect(transaction.verify()).toBeFalse();
            config.getMilestone().aip11 = true;
            expect(transaction.verify()).toBeTrue();
        });

        it("should not deserialize a malformed signature", () => {
            const transaction = factory.fromData(multiSignatureRegistration);
            transaction.serialized = transaction.serialized.slice(0, transaction.serialized.length - 2);

            expect(() => factory.fromBytes(transaction.serialized)).toThrowError(InvalidTransactionBytesError);
        });
    });

    describe("ser/deserialize - ipfs", () => {
        let ipfsTransaction;

        const ipfsIds = [
            "QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w",
            "QmYSK2JyM3RyDyB52caZCTKFR3HKniEcMnNJYdk8DQ6KKB",
            "QmQeUqdjFmaxuJewStqCLUoKrR9khqb4Edw9TfRQQdfWz3",
            "Qma98bk1hjiRZDTmYmfiUXDj8hXXt7uGA5roU5mfUb3sVG",
        ];

        beforeAll(() => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            setup();
        });

        beforeEach(() => {
            ipfsTransaction = builderFactory
                .ipfs()
                .fee("50000000")
                .version(2)
                .network(23)
                .ipfsAsset(ipfsIds[0])
                .sign("dummy passphrase")
                .getStruct();
        });

        it("should ser/deserialize giving back original fields", () => {
            const serialized = factory.fromData(ipfsTransaction).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, ipfsTransaction);

            expect(deserialized.data.asset).toEqual(ipfsTransaction.asset);
        });

        it("should fail to verify", () => {
            const transaction = factory.fromData(ipfsTransaction);
            config.getMilestone().aip11 = false;
            expect(transaction.verify()).toBeFalse();
            config.getMilestone().aip11 = true;
            expect(transaction.verify()).toBeTrue();
        });
    });

    describe("ser/deserialize - delegate resignation", () => {
        it("should ser/deserialize giving back original fields", () => {
            const delegateResignation = builderFactory
                .delegateResignation()
                .fee("50000000")
                .network(23)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = factory.fromData(delegateResignation).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, delegateResignation);
        });

        it("should fail to verify", () => {
            const delegateResignation = builderFactory
                .delegateResignation()
                .fee("50000000")
                .network(23)
                .sign("dummy passphrase")
                .build();

            config.getMilestone().aip11 = false;
            expect(delegateResignation.verify()).toBeFalse();
            config.getMilestone().aip11 = true;
            expect(delegateResignation.verify()).toBeTrue();
        });
    });

    describe("ser/deserialize - multi payment", () => {
        beforeAll(() => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            setup();
        });

        it("should ser/deserialize giving back original fields", () => {
            const multiPayment = builderFactory
                .multiPayment()
                .fee("50000000")
                .network(23)
                .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "1555")
                .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "5000")
                .vendorField("Multipayment")
                .sign("dummy passphrase")
                .getStruct();

            const serialized = factory.fromData(multiPayment).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, multiPayment);
        });

        it("should fail to verify", () => {
            const multiPayment = builderFactory
                .multiPayment()
                .fee("50000000")
                .network(23)
                .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "1555")
                .addPayment("AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C", "5000")
                .sign("dummy passphrase")
                .build();

            config.getMilestone().aip11 = false;
            expect(multiPayment.verify()).toBeFalse();
            config.getMilestone().aip11 = true;
            expect(multiPayment.verify()).toBeTrue();
        });

        it("should fail if more than hardcoded maximum of payments", () => {
            const multiPayment = builderFactory.multiPayment().fee("50000000").network(23);

            for (let i = 0; i < config.getMilestone().multiPaymentLimit; i++) {
                multiPayment.addPayment(Address.fromPassphrase(`recipient-${i}`, { pubKeyHash: 23 }), "1");
            }

            expect(() =>
                multiPayment.addPayment(Address.fromPassphrase("recipientBad", { pubKeyHash: 23 }), "1"),
            ).toThrow(MaximumPaymentCountExceededError);

            const transaction = multiPayment.sign("dummy passphrase").build();
            expect(transaction.verify()).toBeTrue();
            expect(factory.fromBytes(transaction.serialized, true).verify()).toBeTrue();
        });

        it("should fail if recipient on different network", () => {
            expect(() =>
                builderFactory
                    .multiPayment()
                    .fee("50000000")
                    .addPayment("DBzGiUk8UVjB2dKCfGRixknB7Ki3Zhqthp", "1555")
                    .addPayment("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", "1555")
                    .sign("dummy passphrase")
                    .build(),
            ).toThrow(InvalidTransactionBytesError);
        });
    });

    describe("ser/deserialize - htlc lock", () => {
        const htlcLockAsset = {
            secretHash: htlcSecretHashHex,
            expiration: {
                type: HtlcLockExpirationType.EpochTimestamp,
                value: Math.floor(Date.now() / 1000),
            },
        };

        beforeAll(() => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            setup();
        });

        it("should ser/deserialize giving back original fields", () => {
            const htlcLock = builderFactory
                .htlcLock()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("10000")
                .fee("50000000")
                .network(23)
                .vendorField("HTLC")
                .htlcLockAsset(htlcLockAsset)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = factory.fromData(htlcLock).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, htlcLock);

            expect(deserialized.data.asset).toEqual(htlcLock.asset);
        });

        it("should fail to verify", () => {
            const htlcLock = builderFactory
                .htlcLock()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("10000")
                .fee("50000000")
                .network(23)
                .htlcLockAsset(htlcLockAsset)
                .sign("dummy passphrase")
                .build();

            config.getMilestone().aip11 = false;
            expect(htlcLock.verify()).toBeFalse();
            config.getMilestone().aip11 = true;
            expect(htlcLock.verify()).toBeTrue();
        });
    });

    describe("ser/deserialize - htlc claim", () => {
        const htlcClaimAsset = {
            lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            unlockSecret: htlcSecretHex,
        };

        beforeAll(() => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            setup();
        });

        it("should ser/deserialize giving back original fields", () => {
            const htlcClaim = builderFactory
                .htlcClaim()
                .fee("0")
                .network(23)
                .htlcClaimAsset(htlcClaimAsset)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = factory.fromData(htlcClaim).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, htlcClaim);

            expect(deserialized.data.asset).toEqual(htlcClaim.asset);
        });

        it("should fail to verify", () => {
            const htlcClaim = builderFactory
                .htlcClaim()
                .fee("0")
                .network(23)
                .htlcClaimAsset(htlcClaimAsset)
                .sign("dummy passphrase")
                .build();

            config.getMilestone().aip11 = false;
            expect(htlcClaim.verify()).toBeFalse();
            config.getMilestone().aip11 = true;
            expect(htlcClaim.verify()).toBeTrue();
        });
    });

    describe("ser/deserialize - htlc refund", () => {
        const htlcRefundAsset = {
            lockTransactionId: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
        };

        beforeAll(() => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            setup();
        });

        it("should ser/deserialize giving back original fields", () => {
            const htlcRefund = builderFactory
                .htlcRefund()
                .fee("0")
                .network(23)
                .htlcRefundAsset(htlcRefundAsset)
                .sign("dummy passphrase")
                .getStruct();

            const serialized = factory.fromData(htlcRefund).serialized.toString("hex");
            const deserialized = deserializer.deserialize(serialized);

            checkCommonFields(deserialized, htlcRefund);

            expect(deserialized.data.asset).toEqual(htlcRefund.asset);
        });

        it("should fail to verify", () => {
            const htlcRefund = builderFactory
                .htlcRefund()
                .fee("0")
                .network(23)
                .htlcRefundAsset(htlcRefundAsset)
                .sign("dummy passphrase")
                .build();

            config.getMilestone().aip11 = false;
            expect(htlcRefund.verify()).toBeFalse();
            config.getMilestone().aip11 = true;
            expect(htlcRefund.verify()).toBeTrue();
        });
    });

    describe("deserialize - others", () => {
        beforeAll(() => {
            // todo: completely wrap this into a function to hide the generation and setting of the config?
            setup();
        });

        it("should throw if type is not supported", () => {
            const serializeWrongType = (transaction: ITransactionData) => {
                // copy-paste from transaction serializer, common stuff
                const buffer = new ByteBuffer(512, true);
                buffer.writeByte(0xff);
                buffer.writeByte(2);
                buffer.writeByte(transaction.network);
                buffer.writeUint32(TransactionTypeGroup.Core);
                buffer.writeUint16(transaction.type);
                buffer.writeUint64(transaction.nonce!.toFixed());
                buffer.append(transaction.senderPublicKey, "hex");
                buffer.writeUint64(BigNumber.make(transaction.fee).toFixed());
                buffer.writeByte(0x00);

                return Buffer.from(buffer.flip().toBuffer());
            };
            const transactionWrongType = builderFactory
                .transfer()
                .recipientId("APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq")
                .amount("10000")
                .fee("50000000")
                .vendorField("yo")
                .network(23)
                .sign("dummy passphrase")
                .getStruct();
            transactionWrongType.type = 55;

            const serialized = serializeWrongType(transactionWrongType).toString("hex");
            expect(() => deserializer.deserialize(serialized)).toThrow(UnkownTransactionError);
        });
    });

    describe("deserialize Schnorr / ECDSA", () => {
        const builderWith = (hasher: (buffer: Buffer, keys) => string, hasher2?: (buffer: Buffer, keys) => string) => {
            const keys = Keys.fromPassphrase("secret");

            const builder = builderFactory
                .transfer()
                .senderPublicKey(keys.publicKey)
                .recipientId(Address.fromPublicKey(keys.publicKey, { pubKeyHash: 23 }))
                .amount("10000")
                .fee("50000000");

            const buffer = helpers.toHash(builder.data, {
                excludeSignature: true,
                excludeSecondSignature: true,
            });

            builder.data.signature = hasher(buffer, keys);

            if (hasher2) {
                const keys = Keys.fromPassphrase("secret 2");
                const buffer = helpers.toHash(builder.data, {
                    excludeSecondSignature: true,
                });

                builder.data.secondSignature = hasher2(buffer, keys);
            }

            return builder;
        };

        it("should deserialize a V2 transaction signed with Schnorr", () => {
            const builder = builderWith(Hash.signSchnorr);

            let transaction: ITransaction;
            expect(builder.data.version).toBe(2);
            expect(() => (transaction = builder.build())).not.toThrow();
            //@ts-ignore
            expect(transaction.verify()).toBeTrue();
        });

        it("should deserialize a V2 transaction signed with ECDSA", () => {
            const builder = builderWith(Hash.signECDSA);

            let transaction: ITransaction;
            expect(builder.data.version).toBe(2);
            expect(builder.data.signature).not.toHaveLength(64);
            expect(() => (transaction = builder.build())).not.toThrow();
            //@ts-ignore
            expect(transaction.verify()).toBeTrue();
        });

        it("should deserialize a V2 transaction when signed with Schnorr/Schnorr", () => {
            const builder = builderWith(Hash.signSchnorr, Hash.signSchnorr);

            let transaction: ITransaction;
            expect(builder.data.version).toBe(2);
            expect(() => (transaction = builder.build())).not.toThrow();

            //@ts-ignore
            expect(transaction.verify()).toBeTrue();
            //@ts-ignore
            expect(verifier.verifySecondSignature(transaction.data, PublicKey.fromPassphrase("secret 2"))).toBeTrue();
            //@ts-ignore
            expect(verifier.verifySecondSignature(transaction.data, PublicKey.fromPassphrase("secret 3"))).toBeFalse();
        });

        it("should throw when V2 transaction is signed with Schnorr and ECDSA", () => {
            let builder = builderWith(Hash.signSchnorr, Hash.signECDSA);
            expect(builder.data.version).toBe(2);
            expect(() => builder.build()).toThrow();

            builder = builderWith(Hash.signECDSA, Hash.signSchnorr);
            expect(builder.data.version).toBe(2);
            expect(() => builder.build()).toThrow();
        });

        it("should throw when V2 transaction is signed with Schnorr and AIP11 not active", () => {
            const builder = builderWith(Hash.signSchnorr);

            config.getMilestone().aip11 = false;
            expect(builder.data.version).toBe(2);
            expect(() => builder.build()).toThrow();

            config.getMilestone().aip11 = true;
        });

        it("should throw when V1 transaction is signed with Schnorr", () => {
            config.getMilestone().aip11 = false;

            const builder = builderWith(Hash.signSchnorr);
            const buffer = helpers.toHash(builder.data, {
                excludeSignature: true,
                excludeSecondSignature: true,
            });

            builder.data.signature = builder.data.signature = Hash.signSchnorr(buffer, Keys.fromPassphrase("secret"));

            expect(builder.data.version).toBe(1);
            expect(() => builder.build()).toThrow();

            config.getMilestone().aip11 = true;
        });
    });

    describe("serialize - others", () => {
        it("should throw if type is not supported", () => {
            const transactionWrongType = builderFactory
                .transfer()
                .recipientId("APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq")
                .amount("10000")
                .fee("50000000")
                .vendorField("yo")
                .network(23)
                .sign("dummy passphrase")
                .getStruct();
            transactionWrongType.type = 55;

            expect(() => factory.fromData(transactionWrongType)).toThrow(UnkownTransactionError);
        });
    });

    describe("getBytesV1", () => {
        beforeAll(() => (config.getMilestone().aip11 = false));
        afterAll(() => (config.getMilestone().aip11 = true));
        let bytes;

        // it('should return Buffer of simply transaction and buffer must be 292 length', () => {
        //   const transaction = {
        //     type: 0,
        //     amount: 1000,
        //     fee: 2000,
        //     recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
        //     timestamp: 141738,
        //     asset: {},
        //     senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
        //     signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a'
        //   }

        //   bytes = crypto.getBytes(transaction)
        //   expect(bytes).toBeObject()
        //   expect(bytes.toString('hex') + transaction.signature).toHaveLength(292)
        // })

        it("should return Buffer of simply transaction and buffer must be 202 length", () => {
            const transaction = {
                type: 0,
                amount: BigNumber.make(1000),
                fee: BigNumber.make(2000),
                recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
                timestamp: 141738,
                asset: {},
                senderPublicKey: "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09",
                signature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                id: "13987348420913138422",
            };

            bytes = serializer.getBytes(transaction);
            expect(bytes).toBeObject();
            expect(bytes.length).toBe(202);
            expect(bytes.toString("hex")).toBe(
                "00aa2902005d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09171dfc69b54c7fe901e91d5a9ab78388645e2427ea00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e803000000000000d007000000000000618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
            );
        });

        // it('should return Buffer of transaction with second signature and buffer must be 420 length', () => {
        //   const transaction = {
        //     type: 0,
        //     amount: 1000,
        //     fee: 2000,
        //     recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
        //     timestamp: 141738,
        //     asset: {},
        //     senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
        //     signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a',
        //     secondSignature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a'
        //   }

        //   bytes = crypto.getBytes(transaction)
        //   expect(bytes).toBeObject()
        //   expect(bytes.toString('hex') + transaction.signature + transaction.secondSignature).toHaveLength(420)
        // })

        it("should return Buffer of transaction with second signature and buffer must be 266 length", () => {
            const transaction = {
                version: 1,
                type: 0,
                amount: BigNumber.make(1000),
                fee: BigNumber.make(2000),
                recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
                timestamp: 141738,
                asset: {},
                senderPublicKey: "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09",
                signature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                secondSignature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                id: "13987348420913138422",
            };

            bytes = serializer.getBytes(transaction);
            expect(bytes).toBeObject();
            expect(bytes.length).toBe(266);
            expect(bytes.toString("hex")).toBe(
                "00aa2902005d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09171dfc69b54c7fe901e91d5a9ab78388645e2427ea00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e803000000000000d007000000000000618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
            );
        });

        it("should throw for unsupported version", () => {
            const transaction = {
                version: 110,
                type: 0,
                amount: BigNumber.make(1000),
                fee: BigNumber.make(2000),
                recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
                timestamp: 141738,
                asset: {},
                senderPublicKey: "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09",
                signature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                secondSignature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                id: "13987348420913138422",
            };

            expect(() => serializer.getBytes(transaction)).toThrow(TransactionVersionError);
        });
    });
});
