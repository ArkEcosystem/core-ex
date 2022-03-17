import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";

import { Comparator, IteratorMany } from "./utils";

export class QueryIterable implements Contracts.TransactionPool.QueryIterable {
	public transactions: Contracts.Crypto.ITransaction[];
	public predicates: Contracts.TransactionPool.QueryPredicate[] = [];

	public constructor(
		transactions: Contracts.Crypto.ITransaction[],
		predicate?: Contracts.TransactionPool.QueryPredicate,
	) {
		this.transactions = transactions;

		if (predicate) {
			this.predicates.push(predicate);
		}
	}

	public wherePredicate(predicate: Contracts.TransactionPool.QueryPredicate): QueryIterable {
		this.predicates.push(predicate);

		return this;
	}

	public whereId(id: string): QueryIterable {
		return this.wherePredicate(async (t) => t.id === id);
	}

	public whereType(type: Contracts.Crypto.TransactionType | number): QueryIterable {
		return this.wherePredicate(async (t) => t.type === type);
	}

	public whereTypeGroup(typeGroup: Contracts.Crypto.TransactionTypeGroup | number): QueryIterable {
		return this.wherePredicate(async (t) => t.typeGroup === typeGroup);
	}

	public whereVersion(version: number): QueryIterable {
		return this.wherePredicate(async (t) => t.data.version === version);
	}

	public whereKind(transaction: Contracts.Crypto.ITransaction): QueryIterable {
		return this.wherePredicate(async (t) => t.type === transaction.type && t.typeGroup === transaction.typeGroup);
	}

	public async has(): Promise<boolean> {
		return (await this.all()).length > 0;
	}

	public async first(): Promise<Contracts.Crypto.ITransaction> {
		for (const transaction of await this.all()) {
			return transaction;
		}

		throw new Error("Transaction not found");
	}

	public async all(): Promise<Contracts.Crypto.ITransaction[]> {
		const transactions = [];

		for (const transaction of this.transactions) {
			if (await this.#satisfiesPredicates(transaction)) {
				transactions.push(transaction);
			}
		}

		return transactions;
	}

	async #satisfiesPredicates(transaction: Contracts.Crypto.ITransaction): Promise<boolean> {
		if (this.predicates.length === 0) {
			return true;
		}

		for (const predicate of this.predicates) {
			if (! await predicate(transaction)) {
				return false;
			}
		}

		return true;
	}
}

@injectable()
export class Query implements Contracts.TransactionPool.Query {
	@inject(Identifiers.TransactionPoolMempool)
	private readonly mempool!: Contracts.TransactionPool.Mempool;

	public getAll(): QueryIterable {
		return new QueryIterable(Array.from(
			this.mempool.getSenderMempools()
		).flatMap(senderMempool => Array.from(senderMempool.getFromLatest())));
	}

	public getAllBySender(senderPublicKey: string): QueryIterable {
		if (! this.mempool.hasSenderMempool(senderPublicKey)) {
			return new QueryIterable([]);
		}

		return new QueryIterable(Array.from(
			this.mempool.getSenderMempool(senderPublicKey).getFromEarliest()
		));
	}

	public getFromLowestPriority(): QueryIterable {
		const iterable = {
			[Symbol.iterator]: () => {
				const comparator: Comparator<Contracts.Crypto.ITransaction> = (
					a: Contracts.Crypto.ITransaction,
					b: Contracts.Crypto.ITransaction,
				) => a.data.fee.comparedTo(b.data.fee);

				const iterators: Iterator<Contracts.Crypto.ITransaction>[] = [...this.mempool.getSenderMempools()]
					.map((p) => p.getFromLatest())
					.map((index) => index[Symbol.iterator]());

				return new IteratorMany<Contracts.Crypto.ITransaction>(iterators, comparator);
			},
		};

		return new QueryIterable(iterable);
	}

	public getFromHighestPriority(): QueryIterable {
		const iterable = {
			[Symbol.iterator]: () => {
				const comparator: Comparator<Contracts.Crypto.ITransaction> = (
					a: Contracts.Crypto.ITransaction,
					b: Contracts.Crypto.ITransaction,
				) => b.data.fee.comparedTo(a.data.fee);

				const iterators: Iterator<Contracts.Crypto.ITransaction>[] = [...this.mempool.getSenderMempools()]
					.map((p) => p.getFromEarliest())
					.map((index) => index[Symbol.iterator]());

				return new IteratorMany<Contracts.Crypto.ITransaction>(iterators, comparator);
			},
		};

		return new QueryIterable(iterable);
	}
}
