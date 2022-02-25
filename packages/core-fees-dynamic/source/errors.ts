import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

export class TransactionFeeToLowError extends Contracts.TransactionPool.PoolError {
	public constructor(transaction: Interfaces.ITransaction) {
		super(`${transaction} fee is to low to enter the pool`, "ERR_LOW_FEE");
	}
}

export class TransactionFeeToHighError extends Contracts.TransactionPool.PoolError {
	public constructor(transaction: Interfaces.ITransaction) {
		super(`${transaction} fee is to high to enter the pool`, "ERR_HIGH_FEE");
	}
}
