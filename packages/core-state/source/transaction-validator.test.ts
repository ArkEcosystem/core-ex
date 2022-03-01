import { Utils } from "@arkecosystem/core-kernel";
import { TransactionValidator } from "./transaction-validator";
import { AssertionError } from "assert";
import { makeVoteTransactions } from "../test/make-vote-transactions";
import { setUp } from "../test/setup";
import { SinonSpy } from "sinon";
import { describe } from "@arkecosystem/core-test-framework";

let transactionValidator: TransactionValidator;
let applySpy: SinonSpy;

describe("Transaction Validator", ({ it, beforeAll, assert }) => {
    beforeAll(async () => {
        const initialEnv = await setUp();
        transactionValidator = initialEnv.transactionValidator;
        applySpy = initialEnv.spies.applySpy;
    });

	it("should validate transactions", async () => {
		const transaction = makeVoteTransactions(1, [
			`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`,
		]);

		await transactionValidator.validate(transaction[0]);

        assert.true(applySpy.calledWith(transaction[0]));
	});

	it("should throw when transaction id doesn't match deserialised", () => {
		const transaction = makeVoteTransactions(1, [
			`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`,
		]);
		const copiedTransaction = Utils.cloneObject(transaction[0]) as any;
		copiedTransaction.id = "wrong";

		transactionValidator.validate(copiedTransaction).catch((e) => assert.instance(e, AssertionError));
	});
});
