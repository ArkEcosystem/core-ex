import Interfaces from "@arkecosystem/core-crypto-contracts";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import Transactions from "@arkecosystem/core-crypto-transaction";
import { One as MultiPaymentTransaction } from "@arkecosystem/core-crypto-transaction-multi-payment";
import { BigNumber } from "@arkecosystem/utils";

import { InsufficientBalanceError } from "../../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

@Container.injectable()
export class MultiPaymentTransactionHandler extends TransactionHandler {
	@Container.inject(Container.Identifiers.TransactionHistoryService)
	private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

	public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
		return [];
	}

	public walletAttributes(): ReadonlyArray<string> {
		return [];
	}

	public getConstructor(): Transactions.TransactionConstructor {
		return MultiPaymentTransaction;
	}

	public async bootstrap(): Promise<void> {
		const criteria = {
			type: this.getConstructor().type,
			typeGroup: this.getConstructor().typeGroup,
		};

		for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
			AppUtils.assert.defined<string>(transaction.senderPublicKey);
			AppUtils.assert.defined<object>(transaction.asset?.payments);

			const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
			for (const payment of transaction.asset.payments) {
				const recipient: Contracts.State.Wallet = this.walletRepository.findByAddress(payment.recipientId);
				recipient.increaseBalance(payment.amount);
				sender.decreaseBalance(payment.amount);
			}
		}
	}

	public async isActivated(): Promise<boolean> {
		return this.configuration.getMilestone().aip11 === true;
	}

	public async throwIfCannotBeApplied(
		transaction: Interfaces.ITransaction,
		wallet: Contracts.State.Wallet,
	): Promise<void> {
		AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

		const payments: Interfaces.IMultiPaymentItem[] = transaction.data.asset.payments;
		const totalPaymentsAmount = payments.reduce((a, p) => a.plus(p.amount), BigNumber.ZERO);

		if (wallet.getBalance().minus(totalPaymentsAmount).minus(transaction.data.fee).isNegative()) {
			throw new InsufficientBalanceError();
		}

		return super.throwIfCannotBeApplied(transaction, wallet);
	}

	public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
		await super.applyToSender(transaction);

		AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

		const totalPaymentsAmount = transaction.data.asset.payments.reduce((a, p) => a.plus(p.amount), BigNumber.ZERO);

		AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

		const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

		sender.decreaseBalance(totalPaymentsAmount);
	}

	public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
		await super.revertForSender(transaction);

		AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

		const totalPaymentsAmount = transaction.data.asset.payments.reduce((a, p) => a.plus(p.amount), BigNumber.ZERO);

		AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

		const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

		sender.increaseBalance(totalPaymentsAmount);
	}

	public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {
		AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

		for (const payment of transaction.data.asset.payments) {
			const recipient: Contracts.State.Wallet = this.walletRepository.findByAddress(payment.recipientId);

			recipient.increaseBalance(payment.amount);
		}
	}

	public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {
		AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.data.asset?.payments);

		for (const payment of transaction.data.asset.payments) {
			const recipient: Contracts.State.Wallet = this.walletRepository.findByAddress(payment.recipientId);

			recipient.decreaseBalance(payment.amount);
		}
	}
}