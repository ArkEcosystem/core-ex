import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Identities, Utils } from "@arkecosystem/crypto";
import Interfaces from "@arkecosystem/core-crypto-contracts";

// todo: review the implementation
@Container.injectable()
export class BlockState implements Contracts.State.BlockState {
	@Container.inject(Container.Identifiers.WalletRepository)
	private walletRepository!: Contracts.State.WalletRepository;

	@Container.inject(Container.Identifiers.TransactionHandlerRegistry)
	private handlerRegistry!: Handlers.Registry;

	@Container.inject(Container.Identifiers.StateStore)
	private readonly state!: Contracts.State.StateStore;

	@Container.inject(Container.Identifiers.LogService)
	private logger!: Contracts.Kernel.Logger;

	public async applyBlock(block: Interfaces.IBlock): Promise<void> {
		if (block.data.height === 1) {
			this.initGenesisForgerWallet(block.data.generatorPublicKey);
		}

		const previousBlock = this.state.getLastBlock();
		const forgerWallet = this.walletRepository.findByPublicKey(block.data.generatorPublicKey);

		// if (!forgerWallet) {
		//     const msg = `Failed to lookup forger '${block.data.generatorPublicKey}' of block '${block.data.id}'.`;
		//     this.app.terminate(msg);
		// }
		const appliedTransactions: Interfaces.ITransaction[] = [];
		try {
			for (const transaction of block.transactions) {
				await this.applyTransaction(transaction);
				appliedTransactions.push(transaction);
			}
			this.applyBlockToForger(forgerWallet, block.data);

			this.state.setLastBlock(block);
		} catch (error) {
			this.logger.error(error.stack);
			this.logger.error("Failed to apply all transactions in block - reverting previous transactions");
			for (const transaction of appliedTransactions.reverse()) {
				await this.revertTransaction(transaction);
			}

			this.state.setLastBlock(previousBlock);

			throw error;
		}
	}

	public async revertBlock(block: Interfaces.IBlock): Promise<void> {
		const forgerWallet = this.walletRepository.findByPublicKey(block.data.generatorPublicKey);

		// if (!forgerWallet) {
		//     const msg = `Failed to lookup forger '${block.data.generatorPublicKey}' of block '${block.data.id}'.`;
		//     this.app.terminate(msg);
		// }

		const revertedTransactions: Interfaces.ITransaction[] = [];
		try {
			this.revertBlockFromForger(forgerWallet, block.data);

			for (const transaction of block.transactions.slice().reverse()) {
				await this.revertTransaction(transaction);
				revertedTransactions.push(transaction);
			}
		} catch (error) {
			this.logger.error(error.stack);
			this.logger.error("Failed to revert all transactions in block - applying previous transactions");
			for (const transaction of revertedTransactions.reverse()) {
				await this.applyTransaction(transaction);
			}
			throw error;
		}
	}

	public async applyTransaction(transaction: Interfaces.ITransaction): Promise<void> {
		const transactionHandler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);

		await transactionHandler.apply(transaction);

		AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

		const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

		let recipient: Contracts.State.Wallet | undefined;
		if (transaction.data.recipientId) {
			AppUtils.assert.defined<string>(transaction.data.recipientId);

			recipient = this.walletRepository.findByAddress(transaction.data.recipientId);
		}

		// @ts-ignore - Apply vote balance updates
		this.applyVoteBalances(sender, recipient, transaction.data);
	}

	public async revertTransaction(transaction: Interfaces.ITransaction): Promise<void> {
		const { data } = transaction;

		const transactionHandler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);

		AppUtils.assert.defined<string>(data.senderPublicKey);

		const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(data.senderPublicKey);

		let recipient: Contracts.State.Wallet | undefined;
		if (transaction.data.recipientId) {
			AppUtils.assert.defined<string>(transaction.data.recipientId);

			recipient = this.walletRepository.findByAddress(transaction.data.recipientId);
		}

		await transactionHandler.revert(transaction);

		// @ts-ignore - Revert vote balance updates
		this.revertVoteBalances(sender, recipient, data);
	}

	public increaseWalletDelegateVoteBalance(wallet: Contracts.State.Wallet, amount: AppUtils.BigNumber) {
		// ? packages/core-transactions/source/handlers/one/vote.ts:L120 blindly sets "vote" attribute
		// ? is it guaranteed that delegate wallet exists, so delegateWallet.getAttribute("delegate.voteBalance") is safe?
		if (wallet.hasVoted()) {
			const delegatePulicKey = wallet.getAttribute<string>("vote");
			const delegateWallet = this.walletRepository.findByPublicKey(delegatePulicKey);
			const oldDelegateVoteBalance = delegateWallet.getAttribute<AppUtils.BigNumber>("delegate.voteBalance");
			const newDelegateVoteBalance = oldDelegateVoteBalance.plus(amount);
			delegateWallet.setAttribute("delegate.voteBalance", newDelegateVoteBalance);
		}
	}

	public decreaseWalletDelegateVoteBalance(wallet: Contracts.State.Wallet, amount: AppUtils.BigNumber) {
		if (wallet.hasVoted()) {
			const delegatePulicKey = wallet.getAttribute<string>("vote");
			const delegateWallet = this.walletRepository.findByPublicKey(delegatePulicKey);
			const oldDelegateVoteBalance = delegateWallet.getAttribute<AppUtils.BigNumber>("delegate.voteBalance");
			const newDelegateVoteBalance = oldDelegateVoteBalance.minus(amount);
			delegateWallet.setAttribute("delegate.voteBalance", newDelegateVoteBalance);
		}
	}

	// WALLETS
	private applyVoteBalances(
		sender: Contracts.State.Wallet,
		recipient: Contracts.State.Wallet,
		transaction: Interfaces.ITransactionData,
	): void {
		return this.updateVoteBalances(sender, recipient, transaction, false);
	}

	private revertVoteBalances(
		sender: Contracts.State.Wallet,
		recipient: Contracts.State.Wallet,
		transaction: Interfaces.ITransactionData,
	): void {
		return this.updateVoteBalances(sender, recipient, transaction, true);
	}

	private applyBlockToForger(forgerWallet: Contracts.State.Wallet, blockData: Interfaces.IBlockData) {
		const delegateAttribute = forgerWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");
		delegateAttribute.producedBlocks++;
		delegateAttribute.forgedFees = delegateAttribute.forgedFees.plus(blockData.totalFee);
		delegateAttribute.forgedRewards = delegateAttribute.forgedRewards.plus(blockData.reward);
		delegateAttribute.lastBlock = blockData;

		const balanceIncrease = blockData.reward.plus(blockData.totalFee);
		this.increaseWalletDelegateVoteBalance(forgerWallet, balanceIncrease);
		forgerWallet.increaseBalance(balanceIncrease);
	}

	private revertBlockFromForger(forgerWallet: Contracts.State.Wallet, blockData: Interfaces.IBlockData) {
		const delegateAttribute = forgerWallet.getAttribute<Contracts.State.WalletDelegateAttributes>("delegate");
		delegateAttribute.producedBlocks--;
		delegateAttribute.forgedFees = delegateAttribute.forgedFees.minus(blockData.totalFee);
		delegateAttribute.forgedRewards = delegateAttribute.forgedRewards.minus(blockData.reward);
		delegateAttribute.lastBlock = undefined;

		const balanceDecrease = blockData.reward.plus(blockData.totalFee);
		this.decreaseWalletDelegateVoteBalance(forgerWallet, balanceDecrease);
		forgerWallet.decreaseBalance(balanceDecrease);
	}

	private updateVoteBalances(
		sender: Contracts.State.Wallet,
		recipient: Contracts.State.Wallet,
		transaction: Interfaces.ITransactionData,
		revert: boolean,
	): void {
		if (
			transaction.type === Enums.TransactionType.Vote &&
			transaction.typeGroup === Enums.TransactionTypeGroup.Core
		) {
			AppUtils.assert.defined<Interfaces.ITransactionAsset>(transaction.asset?.votes);

			const senderDelegatedAmount = sender
				.getBalance()
				// balance already includes reverted fee when updateVoteBalances is called
				.minus(revert ? transaction.fee : Utils.BigNumber.ZERO);

			for (let i = 0; i < transaction.asset.votes.length; i++) {
				const vote: string = transaction.asset.votes[i];
				const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(vote.substr(1));

				// first unvote also changes vote balance by fee
				const senderVoteDelegatedAmount =
					i === 0 && vote.startsWith("-")
						? senderDelegatedAmount.plus(transaction.fee)
						: senderDelegatedAmount;

				const voteBalanceChange: Utils.BigNumber = senderVoteDelegatedAmount
					.times(vote.startsWith("-") ? -1 : 1)
					.times(revert ? -1 : 1);

				const voteBalance: Utils.BigNumber = delegate
					.getAttribute("delegate.voteBalance", Utils.BigNumber.ZERO)
					.plus(voteBalanceChange);

				delegate.setAttribute("delegate.voteBalance", voteBalance);
			}
		} else {
			// Update vote balance of the sender's delegate
			if (sender.hasVoted()) {
				const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
					sender.getAttribute("vote"),
				);

				let amount: AppUtils.BigNumber = transaction.amount;
				if (
					transaction.type === Enums.TransactionType.MultiPayment &&
					transaction.typeGroup === Enums.TransactionTypeGroup.Core
				) {
					AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.asset?.payments);

					amount = transaction.asset.payments.reduce(
						(prev, curr) => prev.plus(curr.amount),
						Utils.BigNumber.ZERO,
					);
				}

				const total: Utils.BigNumber = amount.plus(transaction.fee);

				const voteBalance: Utils.BigNumber = delegate.getAttribute(
					"delegate.voteBalance",
					Utils.BigNumber.ZERO,
				);

				// General case : sender delegate vote balance reduced by amount + fees (or increased if revert)
				delegate.setAttribute(
					"delegate.voteBalance",
					revert ? voteBalance.plus(total) : voteBalance.minus(total),
				);
			}

			if (
				transaction.type === Enums.TransactionType.MultiPayment &&
				transaction.typeGroup === Enums.TransactionTypeGroup.Core
			) {
				AppUtils.assert.defined<Interfaces.IMultiPaymentItem[]>(transaction.asset?.payments);

				// go through all payments and update recipients delegates vote balance
				for (const { recipientId, amount } of transaction.asset.payments) {
					const recipientWallet: Contracts.State.Wallet = this.walletRepository.findByAddress(recipientId);
					if (recipientWallet.hasVoted()) {
						const vote = recipientWallet.getAttribute("vote");
						const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(vote);
						const voteBalance: Utils.BigNumber = delegate.getAttribute(
							"delegate.voteBalance",
							Utils.BigNumber.ZERO,
						);
						delegate.setAttribute(
							"delegate.voteBalance",
							revert ? voteBalance.minus(amount) : voteBalance.plus(amount),
						);
					}
				}
			}

			// Update vote balance of recipient's delegate
			if (recipient && recipient.hasVoted()) {
				const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
					recipient.getAttribute("vote"),
				);
				const voteBalance: Utils.BigNumber = delegate.getAttribute(
					"delegate.voteBalance",
					Utils.BigNumber.ZERO,
				);

				delegate.setAttribute(
					"delegate.voteBalance",
					revert ? voteBalance.minus(transaction.amount) : voteBalance.plus(transaction.amount),
				);
			}
		}
	}

	private initGenesisForgerWallet(forgerPublicKey: string) {
		if (this.walletRepository.hasByPublicKey(forgerPublicKey)) {
			return;
		}

		const forgerAddress = Identities.Address.fromPublicKey(forgerPublicKey);
		const forgerWallet = this.walletRepository.createWallet(forgerAddress);
		forgerWallet.setPublicKey(forgerPublicKey);
		this.walletRepository.index(forgerWallet);
	}
}
