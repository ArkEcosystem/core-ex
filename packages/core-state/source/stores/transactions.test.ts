import { TransactionStore } from "./transactions";
import { Factories } from "@arkecosystem/core-test-framework";
import { ITransaction } from "@arkecosystem/crypto/source/interfaces";
import { describe } from "@arkecosystem/core-test";

let factory: Factories.FactoryBuilder;

describe("TransactionStore", ({ it, assert, beforeEach }) => {
    beforeEach(() => {
        factory = new Factories.FactoryBuilder();
        Factories.Factories.registerTransactionFactory(factory);
    });

	it("should push and get a transaction", () => {
		const transaction: ITransaction = factory.get("Transfer").make();

		// TODO: set id using factory
		transaction.data.id = "1";

		const store = new TransactionStore(100);
		store.push(transaction.data);

		assert.equal(store.count(), 1);
		assert.equal(store.get("1"), transaction.data);
	});
});
