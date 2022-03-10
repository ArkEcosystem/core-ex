import { describe } from "@arkecosystem/core-test-framework";
import { Interfaces, Utils } from "../";
import {
	InvalidTransactionBytesError,
	TransactionSchemaError,
	UnkownTransactionError,
} from "../errors";
import { ITransactionData, ITransactionJson } from "../interfaces";
import { configManager } from "../managers";
import {
	Serializer,
	Transaction,
	TransactionFactory,
	Utils as TransactionUtils,
} from "./";

import { transaction as transactionFixture } from "../../test/fixtures/transaction";
import { transaction as transactionDataFixture } from "../../test/fixtures/transaction";
import { createRandomTx } from "../../test/support";

describe<{
	transactionData: any;
	transactionDataJSON: any;
	transaction: any;
	transactionJson: any;
	transactionSerialized: any;
}>("TransactionFactory", ({ it, assert, beforeEach }) => {
	beforeEach((context) => {
		configManager.setFromPreset("devnet");
	
		context.transactionData = { ...transactionDataFixture };
		context.transactionDataJSON = {
			...context.transactionData,
			...{ amount: context.transactionData.amount.toFixed(), fee: context.transactionData.fee.toFixed() },
		};

		context.transaction = TransactionFactory.fromData(transactionFixture);
		context.transactionJson = context.transaction.toJson();
		context.transactionSerialized = Serializer.serialize(context.transaction);
	});

	it("fromHex - should pass to create a transaction from hex", (context) => {
		assert.equal(TransactionFactory.fromHex(context.transactionSerialized.toString("hex")), transactionFixture);
	});

	it("fromHex - should fail to create a transaction from hex that contains malformed bytes", () => {
		assert.throws(() => TransactionFactory.fromHex("deadbeef"), err => err instanceof InvalidTransactionBytesError);
	});

	it("fromBytes - should pass to create a transaction from a buffer", () => {
		assert.equal(TransactionFactory.fromBytes(transactionSerialized), transactionFixture);
	});

	it("fromBytes - should fail to create a transaction from a buffer that contains malformed bytes", () => {
		assert.throws(() => TransactionFactory.fromBytes(Buffer.from("deadbeef")), err => err instanceof InvalidTransactionBytesError);
	});

	it("fromBytesUnsafe - should pass to create a transaction from a buffer", () => {
		assert.equal(TransactionFactory.fromBytesUnsafe(transactionSerialized), transactionFixture);
	});

	it("fromBytesUnsafe - should fail to create a transaction from a buffer that contains malformed bytes", () => {
		assert.throws(() => TransactionFactory.fromBytesUnsafe(Buffer.from("deadbeef")), err => err instanceof InvalidTransactionBytesError);
	});

	// Old tests
	it("fromBytesUnsafe - should be ok", (context) => {
		const bytes = TransactionUtils.toBytes(context.transactionData);
		const id = context.transactionData.id;

		const transaction = TransactionFactory.fromBytesUnsafe(bytes, id);
		assert.instance(transaction, Transaction);
		delete context.transactionDataJSON.typeGroup;
		assert.equal(transaction.toJson(), context.transactionDataJSON);
	});

	it("fromData - should pass to create a transaction from an object", () => {
		assert.equal(TransactionFactory.fromData(transaction.data), transactionFixture);
	});

	it("fromData - should fail to create a transaction from an object that contains malformed data", () => {
		assert.throws(() =>
			TransactionFactory.fromData({
				...transaction.data,
				...{ fee: Utils.BigNumber.make(0) },
			}), err => err instanceof TransactionSchemaError);
	});

	// Old tests
	it("fromData - should match transaction id", () => {
		configManager.setFromPreset("testnet");
		[0, 2, 3]
			.map((type) => createRandomTx(type))
			.forEach((transaction) => {
				const originalId = transaction.data.id;
				const newTransaction = TransactionFactory.fromData(transaction.data);
				assert.equal(newTransaction.data.id, originalId);
			});
	});

	it("fromData - should throw when getting garbage", () => {
		assert.throws(() => TransactionFactory.fromData({} as ITransactionData), err => err instanceof UnkownTransactionError);
		assert.throws(() => TransactionFactory.fromData({ type: 0 } as ITransactionData), err => err instanceof TransactionSchemaError);
	});

	it("fromJson - should pass to create a transaction from JSON", () => {
		assert.equal(TransactionFactory.fromJson(transactionJson), transactionFixture);
	});

	it("fromJson - should fail to create a transaction from JSON that contains malformed data", () => {
		assert.throws(() =>
			TransactionFactory.fromJson({
				...transactionJson,
				...{ senderPublicKey: "something" },
			}), err => err instanceof TransactionSchemaError);
	});
});
