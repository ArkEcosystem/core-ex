import { Address, Keys } from "@arkecosystem/crypto-identities";
import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../../test";
import { devnet } from "../../test/networks/devnet";
import { testnet } from "../../test/networks/testnet";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { TransactionVersionError } from "../errors";
import { Helpers } from "../helpers";
import { TransactionSigner } from "../signer";
import { InternalTransactionType } from "../types";
import {
    DelegateRegistrationTransaction,
    DelegateResignationTransaction,
    HtlcClaimTransaction,
    HtlcLockTransaction,
    HtlcRefundTransaction,
    IpfsTransaction,
    MultiPaymentTransaction,
    MultiSignatureRegistrationTransaction,
    SecondSignatureRegistrationTransaction,
    TransferTransaction,
    VoteTransaction,
} from "../types/two";

let configManager: ConfigManager;
let builderFactory: TransactionBuilderFactory;
let transactionSigner: TransactionSigner;

const setupForNetwork = (network) => {
    const services = createServices("testnet");

    const typesMap = new Map();
    for (const Transaction of [
        TransferTransaction,
        SecondSignatureRegistrationTransaction,
        DelegateRegistrationTransaction,
        VoteTransaction,
        MultiSignatureRegistrationTransaction,
        IpfsTransaction,
        MultiPaymentTransaction,
        DelegateResignationTransaction,
        HtlcLockTransaction,
        HtlcClaimTransaction,
        HtlcRefundTransaction,
    ]) {
        const internalType: InternalTransactionType = InternalTransactionType.from(
            Transaction.type,
            Transaction.typeGroup,
        );
        typesMap.set(internalType, new Map().set(Transaction.version, Transaction));

        services.validator.extendTransaction(Transaction.getSchema(), true);
    }

    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
    transactionSigner = services.signer;
};

beforeEach(() => {
    setupForNetwork(testnet);
});

describe.each([
    "transfer",
    "secondSignature",
    "delegateRegistration",
    "vote",
    "multiSignature",
    "ipfs",
    "multiPayment",
    "delegateResignation",
    "htlcLock",
    "htlcClaim",
    "htlcRefund",
])("%s", (transactionType) => {
    let builder;
    beforeEach(() => {
        setupForNetwork(testnet);
        builder = builderFactory[transactionType]();
    });

    describe("TransactionBuilder", () => {
        let identity;
        let identitySecond;

        beforeEach(() => {
            identity = {
                address: "AGeYmgbg2LgGxRW2vNNJvQ88PknEJsYizC",
                keys: {
                    compressed: true,
                    privateKey: "d8839c2432bfd0a67ef10a804ba991eabba19f154a3d707917681d45822a5712",
                    publicKey: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
                },
                passphrase: "this is a top secret passphrase",
                privateKey: "d8839c2432bfd0a67ef10a804ba991eabba19f154a3d707917681d45822a5712",
                publicKey: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
                wif: "Ue7A6vSx7ewATPp2dA6UbJ8F39DbZwaHTqhD1MrhzmJqRJmvfZ6C",
            };

            identitySecond = {
                address: "AGtTiW1cXAr7xCGTdkb9Twe8XcNsiKCSt2",
                keys: {
                    compressed: true,
                    privateKey: "038422b5c5758218669fcc343ee3fe74bc9f7f6f59caf0d41d89d96e881849d6",
                    publicKey: "03699e966b2525f9088a6941d8d94f7869964a000efe65783d78ac82e1199fe609",
                },
                passphrase: "this is a top secret second passphrase",
                privateKey: "038422b5c5758218669fcc343ee3fe74bc9f7f6f59caf0d41d89d96e881849d6",
                publicKey: "03699e966b2525f9088a6941d8d94f7869964a000efe65783d78ac82e1199fe609",
                wif: "UWy7mmqcUYZeAsvkvkDN3srwa1pnLbVZj2N2TxH6GhTmw1xP3D8k",
            };
        });

        afterEach(() => jest.restoreAllMocks());

        describe("inherits TransactionBuilder", () => {
            it("should have the essential properties", () => {
                expect(builder).toHaveProperty("data.id", undefined);
                expect(builder).toHaveProperty("data.timestamp");
                expect(builder).toHaveProperty("data.version");

                expect(builder).toHaveProperty("data.type");
                expect(builder).toHaveProperty("data.fee");
            });

            describe("builder", () => {
                let nonce;
                let data;

                beforeEach(() => {
                    nonce = BigNumber.make(0);

                    data = {
                        id: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8dae1a1f",
                        amount: BigNumber.ONE,
                        fee: BigNumber.ONE,
                        recipientId: "AZT6b2Vm6VgNF7gW49M4wvUVBBntWxdCj5",
                        senderPublicKey: "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                        nonce,
                        type: 0,
                        version: 0x02,
                    };
                });

                it("should return a Transaction model with the builder data", () => {
                    builder.data = data;

                    const transaction = builder.build();

                    expect(transaction.type).toBe(0);
                    expect(transaction.data.amount).toEqual(BigNumber.ONE);
                    expect(transaction.data.fee).toEqual(BigNumber.ONE);
                    expect(transaction.data.recipientId).toBe("AZT6b2Vm6VgNF7gW49M4wvUVBBntWxdCj5");
                    expect(transaction.data.senderPublicKey).toBe(
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                    );
                    expect(transaction.data.nonce).toEqual(nonce);
                    expect(transaction.data.version).toBe(0x02);
                });

                it("could merge and override the builder data", () => {
                    builder.data = data;

                    const transaction = builder.build({
                        amount: BigNumber.make(33),
                        fee: BigNumber.make(1000),
                    });

                    expect(transaction.data.amount).toEqual(BigNumber.make(33));
                    expect(transaction.data.fee).toEqual(BigNumber.make(1000));
                    expect(transaction.data.recipientId).toBe("AZT6b2Vm6VgNF7gW49M4wvUVBBntWxdCj5");
                    expect(transaction.data.senderPublicKey).toBe(
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                    );
                    expect(transaction.data.nonce).toEqual(nonce);
                    expect(transaction.data.version).toBe(0x02);
                });
            });

            describe("fee", () => {
                it("should set the fee", () => {
                    builder.fee("255");
                    expect(builder.data.fee).toEqual(BigNumber.make(255));
                });
            });

            describe("amount", () => {
                it("should set the amount", () => {
                    builder.amount("255");
                    expect(builder.data.amount).toEqual(BigNumber.make(255));
                });
            });

            describe("recipientId", () => {
                it("should set the recipient id", () => {
                    builder.recipientId("fake");
                    expect(builder.data.recipientId).toBe("fake");
                });
            });

            describe("senderPublicKey", () => {
                it("should set the sender public key", () => {
                    builder.senderPublicKey("fake");
                    expect(builder.data.senderPublicKey).toBe("fake");
                });
            });
        });

        describe("sign", () => {
            it("signs this transaction with the keys of the passphrase", () => {
                const spyKeys = jest.spyOn(Keys, "fromPassphrase").mockReturnValueOnce(identity.keys);
                const spySign = jest.spyOn(transactionSigner, "sign").mockImplementationOnce(jest.fn());

                builder.sign(identity.bip39);

                expect(spyKeys).toHaveBeenCalledWith(identity.bip39);
                expect(spySign).toHaveBeenCalledWith(builder.getSigningObject(), identity.keys, {
                    disableVersionCheck: false,
                });
            });

            it("establishes the public key of the sender", () => {
                const spyKeys = jest.spyOn(Keys, "fromPassphrase").mockReturnValueOnce(identity.keys);
                const spySign = jest.spyOn(transactionSigner, "sign").mockImplementationOnce(jest.fn());

                builder.sign(identity.bip39);

                expect(builder.data.senderPublicKey).toBe(identity.keys.publicKey);
                expect(spyKeys).toHaveBeenCalledWith(identity.bip39);
                expect(spySign).toHaveBeenCalledWith(builder.getSigningObject(), identity.keys, {
                    disableVersionCheck: false,
                });
            });
        });

        describe("signWithWif", () => {
            it("signs this transaction with keys from a wif", () => {
                const spyKeys = jest.spyOn(Keys, "fromWIF").mockReturnValueOnce(identity.keys);
                const spySign = jest.spyOn(transactionSigner, "sign").mockImplementationOnce(jest.fn());

                builder.signWithWif(identity.bip39);

                expect(spyKeys).toHaveBeenCalledWith(identity.bip39, {
                    wif: 186,
                });
                expect(spySign).toHaveBeenCalledWith(builder.getSigningObject(), identity.keys, {
                    disableVersionCheck: false,
                });
            });

            it("establishes the public key of the sender", () => {
                const spySign = jest.spyOn(transactionSigner, "sign").mockImplementationOnce(jest.fn());

                builder.signWithWif(identity.wif);

                expect(builder.data.senderPublicKey).toBe(identity.publicKey);
                expect(spySign).toHaveBeenCalledWith(builder.getSigningObject(), identity.keys, {
                    disableVersionCheck: false,
                });
            });
        });

        describe("secondSign", () => {
            it("should second sign the transaction", () => {
                const spyKeys = jest.spyOn(Keys, "fromPassphrase").mockReturnValueOnce(identitySecond.keys);
                const spySecondSign = jest.spyOn(transactionSigner, "secondSign").mockImplementationOnce(jest.fn());

                builder.secondSign(identitySecond.bip39);

                expect(spyKeys).toHaveBeenCalledWith(identitySecond.bip39);
                expect(spySecondSign).toHaveBeenCalledWith(builder.getSigningObject(), identitySecond.keys);
            });
        });

        describe("secondSignWithWif", () => {
            it("signs this transaction with the keys of a second wif", () => {
                const spyKeys = jest.spyOn(Keys, "fromWIF").mockReturnValueOnce(identitySecond.keys);
                const spySecondSign = jest.spyOn(transactionSigner, "secondSign").mockImplementationOnce(jest.fn());

                builder.secondSignWithWif(identitySecond.bip39, undefined);

                expect(spyKeys).toHaveBeenCalledWith(identitySecond.bip39, {
                    wif: 186,
                });
                expect(spySecondSign).toHaveBeenCalledWith(builder.getSigningObject(), identitySecond.keys);
            });
        });

        describe("multiSignWithWif", () => {
            it("signs this transaction with the keys of a multisig wif", () => {
                const spyKeys = jest.spyOn(Keys, "fromWIF").mockReturnValueOnce(identitySecond.keys);
                const spyMultiSign = jest.spyOn(transactionSigner, "multiSign").mockImplementationOnce(jest.fn());

                builder.senderPublicKey(identity.publicKey).multiSignWithWif(0, identitySecond.bip39, undefined);

                expect(spyKeys).toHaveBeenCalledWith(identitySecond.bip39, {
                    wif: 186,
                });
                expect(spyMultiSign).toHaveBeenCalledWith(builder.getSigningObject(), identitySecond.keys, 0);
            });
        });
    });
});

describe("Setting the version number explicitly", () => {
    it("should not throw transaction version error when specifically setting version 1 and aip11 is false", () => {
        setupForNetwork(devnet);
        configManager.getMilestone().aip11 = false;

        const recipientAddress = Address.fromPassphrase("recipient's secret", { pubKeyHash: 23 });
        const transaction = builderFactory.transfer().version(1).amount("100").recipientId(recipientAddress);

        let signedTransaction;
        expect(() => (signedTransaction = transaction.sign("sender's secret"))).not.toThrowError(
            TransactionVersionError,
        );
        expect(signedTransaction.data.version).toEqual(1);
        expect(() => signedTransaction.build()).not.toThrowError(TransactionVersionError);
    });
    it("should not throw transaction version error when specifically setting version 1 and aip11 is true", () => {
        setupForNetwork(devnet);
        configManager.getMilestone().aip11 = true;

        const recipientAddress = Address.fromPassphrase("recipient's secret", { pubKeyHash: 23 });
        const transaction = builderFactory.transfer().version(1).amount("100").recipientId(recipientAddress);

        let signedTransaction;
        expect(() => (signedTransaction = transaction.sign("sender's secret"))).not.toThrowError(
            TransactionVersionError,
        );
        expect(signedTransaction.data.version).toEqual(1);
        expect(() => signedTransaction.build()).not.toThrowError(TransactionVersionError);
    });

    it("should not throw transaction version error when specifically setting version 2 and aip11 is false", () => {
        setupForNetwork(devnet);
        configManager.getMilestone().aip11 = false;

        const recipientAddress = Address.fromPassphrase("recipient's secret", { pubKeyHash: 23 });
        const transaction = builderFactory.transfer().version(2).amount("100").recipientId(recipientAddress);

        let signedTransaction;

        expect(() => (signedTransaction = transaction.sign("sender's secret"))).not.toThrowError(
            TransactionVersionError,
        );
        expect(signedTransaction.data.version).toEqual(2);
        expect(() => signedTransaction.build()).not.toThrowError(TransactionVersionError);
    });

    it("should not throw transaction version error when specifically setting version 2 and aip11 is true", () => {
        setupForNetwork(devnet);
        configManager.getMilestone().aip11 = true;

        const recipientAddress = Address.fromPassphrase("recipient's secret", { pubKeyHash: 23 });
        const transaction = builderFactory.transfer().version(2).amount("100").recipientId(recipientAddress);

        let signedTransaction;

        expect(() => (signedTransaction = transaction.sign("sender's secret"))).not.toThrowError(
            TransactionVersionError,
        );
        expect(signedTransaction.data.version).toEqual(2);

        expect(() => signedTransaction.build()).not.toThrowError(TransactionVersionError);
    });

    it("should throw transaction version error when no version is specified, but it is version 1 and we have reached aip11", () => {
        setupForNetwork(devnet);
        configManager.getMilestone().aip11 = false;

        const recipientAddress = Address.fromPassphrase("recipient's secret", { pubKeyHash: 23 });
        const transaction = builderFactory.transfer().amount("100").recipientId(recipientAddress);
        configManager.getMilestone().aip11 = true;

        expect(() => transaction.sign("sender's secret")).toThrowError(TransactionVersionError);
    });

    it("should throw transaction version error when no version is specified, but it is version 2 and we have not reached aip11", () => {
        setupForNetwork(devnet);
        configManager.getMilestone().aip11 = true;

        const recipientAddress = Address.fromPassphrase("recipient's secret", { pubKeyHash: 23 });
        const transaction = builderFactory.transfer().amount("100").recipientId(recipientAddress);
        configManager.getMilestone().aip11 = false;

        expect(() => transaction.sign("sender's secret")).toThrowError(TransactionVersionError);
    });
});
