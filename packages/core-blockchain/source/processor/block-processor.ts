import Contracts, { Crypto, Identifiers } from "@arkecosystem/core-contracts";
import { Repositories } from "@arkecosystem/core-database";
import { Container, Services, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { BigNumber } from "@arkecosystem/utils";

import {
	AcceptBlockHandler,
	AlreadyForgedHandler,
	IncompatibleTransactionsHandler,
	InvalidGeneratorHandler,
	NonceOutOfOrderHandler,
	UnchainedHandler,
	VerificationFailedHandler,
} from "./handlers";

export enum BlockProcessorResult {
	Accepted,
	DiscardedButCanBeBroadcasted,
	Rejected,
	Rollback,
	Reverted,
	Corrupted,
}

@Container.injectable()
export class BlockProcessor {
	@Container.inject(Identifiers.Application)
	private readonly app!: Contracts.Kernel.Application;

	@Container.inject(Identifiers.LogService)
	private readonly logger!: Contracts.Kernel.Logger;

	@Container.inject(Identifiers.BlockchainService)
	private readonly blockchain!: Contracts.Blockchain.Blockchain;

	@Container.inject(Identifiers.DatabaseTransactionRepository)
	private readonly transactionRepository!: Repositories.TransactionRepository;

	@Container.inject(Identifiers.WalletRepository)
	@Container.tagged("state", "blockchain")
	private readonly walletRepository!: Contracts.State.WalletRepository;

	@Container.inject(Identifiers.StateStore)
	private readonly stateStore!: Contracts.State.StateStore;

	@Container.inject(Identifiers.TriggerService)
	private readonly triggers!: Services.Triggers.Triggers;

	@Container.inject(Identifiers.Cryptography.Configuration)
	private readonly configuration: Crypto.IConfiguration;

	@Container.inject(Identifiers.Cryptography.Time.Slots)
	private readonly slots: any;

	public async process(block: Crypto.IBlock): Promise<BlockProcessorResult> {
		if (!(await this.verifyBlock(block))) {
			return this.app.resolve<VerificationFailedHandler>(VerificationFailedHandler).execute(block);
		}

		if (this.blockContainsIncompatibleTransactions(block)) {
			return this.app.resolve<IncompatibleTransactionsHandler>(IncompatibleTransactionsHandler).execute();
		}

		if (this.blockContainsOutOfOrderNonce(block)) {
			return this.app.resolve<NonceOutOfOrderHandler>(NonceOutOfOrderHandler).execute();
		}

		const blockTimeLookup = await AppUtils.forgingInfoCalculator.getBlockTimeLookup(
			this.app,
			block.data.height,
			this.configuration,
		);

		const isValidGenerator: boolean = await this.validateGenerator(block);
		const isChained: boolean = AppUtils.isBlockChained(
			this.blockchain.getLastBlock().data,
			block.data,
			blockTimeLookup,
			this.slots,
		);
		if (!isChained) {
			return this.app.resolve<UnchainedHandler>(UnchainedHandler).initialize(isValidGenerator).execute(block);
		}

		if (!isValidGenerator) {
			return this.app.resolve<InvalidGeneratorHandler>(InvalidGeneratorHandler).execute(block);
		}

		const containsForgedTransactions: boolean = await this.checkBlockContainsForgedTransactions(block);
		if (containsForgedTransactions) {
			return this.app.resolve<AlreadyForgedHandler>(AlreadyForgedHandler).execute(block);
		}

		return this.app.resolve<AcceptBlockHandler>(AcceptBlockHandler).execute(block);
	}

	private async verifyBlock(block: Crypto.IBlock): Promise<boolean> {
		if (block.verification.containsMultiSignatures) {
			try {
				for (const transaction of block.transactions) {
					const registry = this.app.getTagged<Contracts.Transactions.ITransactionHandlerRegistry>(
						Identifiers.TransactionHandlerRegistry,
						"state",
						"blockchain",
					);
					const handler = await registry.getActivatedHandlerForData(transaction.data);
					await handler.verify(transaction);
				}

				block.verification = await block.verify();
			} catch (error) {
				this.logger.warning(`Failed to verify block, because: ${error.message}`);
				block.verification.verified = false;
			}
		}

		const { verified } = block.verification;
		if (!verified) {
			this.logger.warning(
				`Block ${block.data.height.toLocaleString()} (${
					block.data.id
				}) disregarded because verification failed`,
			);

			this.logger.warning(JSON.stringify(block.verification, undefined, 4));

			return false;
		}

		return true;
	}

	private async checkBlockContainsForgedTransactions(block: Crypto.IBlock): Promise<boolean> {
		if (block.transactions.length > 0) {
			const transactionIds = block.transactions.map((tx) => {
				AppUtils.assert.defined<string>(tx.id);

				return tx.id;
			});

			const forgedIds: string[] = await this.transactionRepository.getForgedTransactionsIds(transactionIds);

			if (this.stateStore.getLastBlock().data.height !== this.stateStore.getLastStoredBlockHeight()) {
				const transactionIdsSet = new Set<string>(transactionIds);

				for (const stateBlock of this.stateStore
					.getLastBlocks()
					.filter((block) => block.data.height > this.stateStore.getLastStoredBlockHeight())) {
					for (const tx of stateBlock.transactions) {
						AppUtils.assert.defined<string>(tx.id);

						if (transactionIdsSet.has(tx.id)) {
							forgedIds.push(tx.id);
						}
					}
				}
			}

			if (forgedIds.length > 0) {
				this.logger.warning(
					`Block ${block.data.height.toLocaleString()} disregarded, because it contains already forged transactions`,
				);

				this.logger.debug(`${JSON.stringify(forgedIds, undefined, 4)}`);

				return true;
			}
		}

		return false;
	}

	private blockContainsIncompatibleTransactions(block: Crypto.IBlock): boolean {
		for (let index = 1; index < block.transactions.length; index++) {
			if (block.transactions[index].data.version !== block.transactions[0].data.version) {
				return true;
			}
		}

		return false;
	}

	private blockContainsOutOfOrderNonce(block: Crypto.IBlock): boolean {
		const nonceBySender = {};

		for (const transaction of block.transactions) {
			const data = transaction.data;

			if (data.version && data.version < 2) {
				break;
			}

			AppUtils.assert.defined<string>(data.senderPublicKey);

			const sender: string = data.senderPublicKey;

			if (nonceBySender[sender] === undefined) {
				nonceBySender[sender] = this.walletRepository.getNonce(sender);
			}

			AppUtils.assert.defined<string>(data.nonce);

			const nonce: BigNumber = BigNumber.make(data.nonce);

			if (!nonceBySender[sender].plus(1).isEqualTo(nonce)) {
				this.logger.warning(
					`Block { height: ${block.data.height.toLocaleString()}, id: ${block.data.id} } ` +
						`not accepted: invalid nonce order for sender ${sender}: ` +
						`preceding nonce: ${nonceBySender[sender].toFixed(0)}, ` +
						`transaction ${data.id} has nonce ${nonce.toFixed()}.`,
				);
				return true;
			}

			nonceBySender[sender] = nonce;
		}

		return false;
	}

	private async validateGenerator(block: Crypto.IBlock): Promise<boolean> {
		const blockTimeLookup = await AppUtils.forgingInfoCalculator.getBlockTimeLookup(
			this.app,
			block.data.height,
			this.configuration,
		);

		const roundInfo: Contracts.Shared.RoundInfo = AppUtils.roundCalculator.calculateRound(
			block.data.height,
			this.configuration,
		);
		const delegates: Contracts.State.Wallet[] = await this.triggers.call("getActiveDelegates", {
			roundInfo,
		});

		const forgingInfo: Contracts.Shared.ForgingInfo = AppUtils.forgingInfoCalculator.calculateForgingInfo(
			block.data.timestamp,
			block.data.height,
			blockTimeLookup,
			this.configuration,
			this.slots,
		);

		const forgingDelegate: Contracts.State.Wallet = delegates[forgingInfo.currentForger];

		const walletRepository = this.app.getTagged<Contracts.State.WalletRepository>(
			Identifiers.WalletRepository,
			"state",
			"blockchain",
		);
		const generatorWallet: Contracts.State.Wallet = await walletRepository.findByPublicKey(
			block.data.generatorPublicKey,
		);

		let generatorUsername: string;
		try {
			generatorUsername = generatorWallet.getAttribute("delegate.username");
		} catch {
			return false;
		}

		if (!forgingDelegate) {
			this.logger.debug(
				`Could not decide if delegate ${generatorUsername} (${
					block.data.generatorPublicKey
				}) is allowed to forge block ${block.data.height.toLocaleString()}`,
			);
		} else if (forgingDelegate.getPublicKey() !== block.data.generatorPublicKey) {
			AppUtils.assert.defined<string>(forgingDelegate.getPublicKey());

			const forgingWallet: Contracts.State.Wallet = await walletRepository.findByPublicKey(
				forgingDelegate.getPublicKey()!,
			);
			const forgingUsername: string = forgingWallet.getAttribute("delegate.username");

			this.logger.warning(
				`Delegate ${generatorUsername} (${
					block.data.generatorPublicKey
				}) not allowed to forge, should be ${forgingUsername} (${forgingDelegate.getPublicKey()})`,
			);

			return false;
		}

		this.logger.debug(
			`Delegate ${generatorUsername} (${
				block.data.generatorPublicKey
			}) allowed to forge block ${block.data.height.toLocaleString()}`,
		);

		return true;
	}
}
