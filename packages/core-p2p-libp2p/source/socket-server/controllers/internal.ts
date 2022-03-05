import { inject } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Utils } from "@arkecosystem/core-kernel";
import { DatabaseInteraction } from "@arkecosystem/core-state";

import { Controller } from "./controller";

export class InternalController extends Controller {
	@inject(Identifiers.PeerProcessor)
	private readonly peerProcessor!: Contracts.P2P.PeerProcessor;

	@inject(Identifiers.PeerNetworkMonitor)
	private readonly peerNetworkMonitor!: Contracts.P2P.NetworkMonitor;

	@inject(Identifiers.DatabaseInteraction)
	private readonly databaseInteraction!: DatabaseInteraction;

	@inject(Identifiers.EventDispatcherService)
	private readonly events!: Contracts.Kernel.EventDispatcher;

	@inject(Identifiers.BlockchainService)
	private readonly blockchain!: Contracts.Blockchain.Blockchain;

	@inject(Identifiers.TransactionPoolService)
	private readonly transactionPool!: Contracts.TransactionPool.Service;

	@inject(Identifiers.TransactionPoolCollator)
	private readonly collator!: Contracts.TransactionPool.Collator;

	@inject(Identifiers.Cryptography.Configuration)
	private readonly configuration!: Contracts.Crypto.IConfiguration;

	@inject(Identifiers.Cryptography.Time.Slots)
	private readonly slots!: any;

	public async acceptNewPeer(request: any, h: any): Promise<void> {
		return this.peerProcessor.validateAndAcceptPeer({
			ip: (request.payload as any).ip,
		} as Contracts.P2P.Peer);
	}

	public emitEvent(request: any, h: any): boolean {
		this.events.dispatch((request.payload as any).event, (request.payload as any).body);
		return true;
	}

	public async getUnconfirmedTransactions(request: any, h: any): Promise<Contracts.P2P.UnconfirmedTransactions> {
		const transactions: Contracts.Crypto.ITransaction[] = await this.collator.getBlockCandidateTransactions();

		return {
			poolSize: this.transactionPool.getPoolSize(),
			transactions: transactions.map((t) => t.serialized.toString("hex")),
		};
	}

	public async getCurrentRound(request: any, h: any): Promise<Contracts.P2P.CurrentRound> {
		const lastBlock = this.blockchain.getLastBlock();

		const height = lastBlock.data.height + 1;
		const roundInfo = Utils.roundCalculator.calculateRound(height, this.configuration);

		const reward = this.configuration.getMilestone(height).reward;
		const validators: Contracts.P2P.ValidatorWallet[] = (
			await this.databaseInteraction.getActiveValidators(roundInfo)
		).map((wallet) => ({
			...wallet.getData(),
			validator: wallet.getAttribute("validator"),
		}));

		const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(
			this.app,
			height,
			this.configuration,
		);

		const timestamp = this.slots.getTime();
		const forgingInfo = Utils.forgingInfoCalculator.calculateForgingInfo(
			timestamp,
			height,
			blockTimeLookup,
			this.configuration,
			this.slots,
		);

		return {
			canForge: forgingInfo.canForge,
			current: roundInfo.round,
			currentForger: validators[forgingInfo.currentForger],
			lastBlock: lastBlock.data,
			nextForger: validators[forgingInfo.nextForger],
			reward,
			timestamp: forgingInfo.blockTimestamp,
			validators,
		};
	}

	public async getNetworkState(request: any, h: any): Promise<Contracts.P2P.NetworkState> {
		return this.peerNetworkMonitor.getNetworkState();
	}

	public syncBlockchain(request: any, h: any): boolean {
		this.logger.debug("Blockchain sync check WAKEUP requested by forger");

		this.blockchain.forceWakeup();

		return true;
	}
}
