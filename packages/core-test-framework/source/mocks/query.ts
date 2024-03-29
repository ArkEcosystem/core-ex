import { Contracts } from "@arkecosystem/core-contracts";

let mockTransactions: Partial<Contracts.Crypto.ITransaction>[] = [];

export const setTransactions = (transactions: Partial<Contracts.Crypto.ITransaction>[]) => {
	mockTransactions = transactions;
};

export class CustomQueryIterable implements Partial<Contracts.TransactionPool.QueryIterable> {
	public transactions: Contracts.Crypto.ITransaction[];

	public constructor(items) {
		this.transactions = items;
	}

	public *[Symbol.iterator](): Iterator<Contracts.Crypto.ITransaction> {
		for (const transaction of this.transactions) {
			yield transaction;
		}
	}

	public whereId(id: any): any {
		return this;
	}

	public async has(): Promise<boolean> {
		return this.transactions.length > 0;
	}

	public async first(): Promise<Contracts.Crypto.ITransaction> {
		return this.transactions[0];
	}
}

class TransactionPoolQueryMock implements Partial<Contracts.TransactionPool.Query> {
	public getFromHighestPriority(): Contracts.TransactionPool.QueryIterable {
		return new CustomQueryIterable(mockTransactions) as unknown as Contracts.TransactionPool.QueryIterable;
	}
}

export const instance = new TransactionPoolQueryMock();
