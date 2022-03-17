import { describe, Factories } from "../../../core-test-framework";
import { Contracts } from "@arkecosystem/core-contracts";

import { TransactionStore } from "./transactions";

describe<{
	factory: Factories.FactoryBuilder;
}>("TransactionStore", ({ it, assert, beforeEach }) => {
	beforeEach((context) => {
		context.factory = new Factories.FactoryBuilder();

		Factories.Factories.registerTransactionFactory(context.factory);
	});

	it("should push and get a transaction", (context) => {
		const transaction: Contracts.Crypto.ITransaction = context.factory.get("Transfer").make();

		// TODO: set id using factory
		transaction.data.id = "1";

		const store = new TransactionStore(100);
		store.push(transaction.data);

		assert.equal(store.count(), 1);
		assert.equal(store.get("1"), transaction.data);
	});
});
