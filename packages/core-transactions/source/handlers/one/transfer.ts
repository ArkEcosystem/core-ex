import Contracts, { Crypto } from "@arkecosystem/core-contracts";
import Transactions from "@arkecosystem/core-crypto-transaction";
import { TransferTransaction } from "@arkecosystem/core-crypto-transaction-transfer";
import { Container, Utils } from "@arkecosystem/core-kernel";
import { BigNumber } from "@arkecosystem/utils";

import { isRecipientOnActiveNetwork } from "../../utils";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
@Container.injectable()
export class TransferTransactionHandler extends TransactionHandler {
	public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
		return [];
	}

	public walletAttributes(): ReadonlyArray<string> {
		return [];
	}

	public getConstructor(): Transactions.TransactionConstructor {
		return TransferTransaction;
	}

	public async bootstrap(): Promise<void> {
		const transactions = await this.transactionRepository.findReceivedTransactions();

		for (const transaction of transactions) {
			const wallet: Contracts.State.Wallet = this.walletRepository.findByAddress(transaction.recipientId);
			wallet.increaseBalance(BigNumber.make(transaction.amount));
		}
	}

	public async isActivated(): Promise<boolean> {
		return true;
	}

	public async throwIfCannotBeApplied(
		transaction: Crypto.ITransaction,
		sender: Contracts.State.Wallet,
	): Promise<void> {
		return super.throwIfCannotBeApplied(transaction, sender);
	}

	public hasVendorField(): boolean {
		return true;
	}

	public async throwIfCannotEnterPool(transaction: Crypto.ITransaction): Promise<void> {
		Utils.assert.defined<string>(transaction.data.recipientId);
		const recipientId: string = transaction.data.recipientId;

		// @TODO
		if (!isRecipientOnActiveNetwork(recipientId, undefined, this.configuration)) {
			const network: string = this.configuration.get<string>("network.pubKeyHash");
			throw new Contracts.TransactionPool.PoolError(
				`Recipient ${recipientId} is not on the same network: ${network} `,
				"ERR_INVALID_RECIPIENT",
			);
		}
	}

	public async applyToRecipient(transaction: Crypto.ITransaction): Promise<void> {
		Utils.assert.defined<string>(transaction.data.recipientId);

		const recipient: Contracts.State.Wallet = this.walletRepository.findByAddress(transaction.data.recipientId);

		recipient.increaseBalance(transaction.data.amount);
	}

	public async revertForRecipient(transaction: Crypto.ITransaction): Promise<void> {
		Utils.assert.defined<string>(transaction.data.recipientId);

		const recipient: Contracts.State.Wallet = this.walletRepository.findByAddress(transaction.data.recipientId);

		recipient.decreaseBalance(transaction.data.amount);
	}
}
