import "jest-extended";

import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../test";
import { transaction as transactionFixture } from "../test/fixtures/transaction";
import { createRandomTx } from "../test/support/transactions";
import { ITransaction, ITransactionData, ITransactionJson } from "./contracts";
import { InvalidTransactionBytesError, TransactionSchemaError, UnkownTransactionError } from "./errors";
import { Transaction } from "./types";

let transactionData: ITransactionData;
let transactionDataJSON;

let builderFactory, serializer, factory, config, helpers;

const setup = (network: string) => {
    const services = createServices(network);
    builderFactory = services.builderFactory;
    serializer = services.serializer;
    factory = services.factory;
    config = services.config;
    helpers = services.helpers;

    config.setHeight(2); // v2 transactions
};
setup("devnet");

const expectTransaction = ({ data }): void => {
    expect(data).toEqual(transactionFixture);
};

beforeEach(() => {
    setup("devnet");

    transactionData = { ...transactionFixture };
    transactionDataJSON = {
        ...transactionData,
        ...{ amount: transactionData.amount.toFixed(), fee: transactionData.fee.toFixed() },
    };
});

const transaction: ITransaction = factory.fromData(transactionFixture);
const transactionJson: ITransactionJson = transaction.toJson();
const transactionSerialized: Buffer = serializer.serialize(transaction);

describe("factory", () => {
    describe(".fromHex", () => {
        it("should pass to create a transaction from hex", () => {
            expectTransaction(factory.fromHex(transactionSerialized.toString("hex")));
        });

        it("should fail to create a transaction from hex that contains malformed bytes", () => {
            expect(() => factory.fromHex("deadbeef")).toThrowError(InvalidTransactionBytesError);
        });
    });

    describe(".fromBytes", () => {
        it("should pass to create a transaction from a buffer", () => {
            expectTransaction(factory.fromBytes(transactionSerialized));
        });

        it("should fail to create a transaction from a buffer that contains malformed bytes", () => {
            expect(() => factory.fromBytes(Buffer.from("deadbeef"))).toThrowError(InvalidTransactionBytesError);
        });
    });

    describe(".fromBytesUnsafe", () => {
        it("should pass to create a transaction from a buffer", () => {
            expectTransaction(factory.fromBytesUnsafe(transactionSerialized));
        });

        it("should fail to create a transaction from a buffer that contains malformed bytes", () => {
            expect(() => factory.fromBytesUnsafe(Buffer.from("deadbeef"))).toThrowError(InvalidTransactionBytesError);
        });

        // Old tests
        it("should be ok", () => {
            const bytes = helpers.toBytes(transactionData);
            const id = transactionData.id;

            const transaction = factory.fromBytesUnsafe(bytes, id);
            expect(transaction).toBeInstanceOf(Transaction);
            delete transactionDataJSON.typeGroup;
            expect(transaction.toJson()).toEqual(transactionDataJSON);
        });
    });

    describe(".fromData", () => {
        it("should pass to create a transaction from an object", () => {
            expectTransaction(factory.fromData(transaction.data));
        });

        it("should fail to create a transaction from an object that contains malformed data", () => {
            expect(() =>
                factory.fromData({
                    ...transaction.data,
                    ...{ fee: BigNumber.make(0) },
                }),
            ).toThrowError(TransactionSchemaError);
        });

        // Old tests
        it("should match transaction id", () => {
            setup("testnet");
            [0, 1, 2, 3]
                .map((type) => createRandomTx(type, builderFactory, config))
                .forEach((transaction) => {
                    const originalId = transaction.data.id;
                    const newTransaction = factory.fromData(transaction.data);
                    expect(newTransaction.data.id).toEqual(originalId);
                });
        });

        it("should throw when getting garbage", () => {
            expect(() => factory.fromData({} as ITransactionData)).toThrow(UnkownTransactionError);
            expect(() => factory.fromData({ type: 0 } as ITransactionData)).toThrow(TransactionSchemaError);
        });
    });

    describe(".fromJson", () => {
        it("should pass to create a transaction from JSON", () => {
            expectTransaction(factory.fromJson(transactionJson));
        });

        it("should fail to create a transaction from JSON that contains malformed data", () => {
            expect(() =>
                factory.fromJson({
                    ...transactionJson,
                    ...{ senderPublicKey: "something" },
                }),
            ).toThrowError(TransactionSchemaError);
        });
    });
});
