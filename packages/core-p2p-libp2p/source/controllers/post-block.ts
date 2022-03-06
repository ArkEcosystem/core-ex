import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Exceptions, Identifiers } from "@arkecosystem/core-contracts";
import { Utils } from "@arkecosystem/core-kernel";

import { IMessage } from "../contracts";
import { decodeMessage } from "../utils";

// import { constants } from "../../constants";
// import { mapAddr } from "../utils/map-addr";

@injectable()
export class PostBlockHandler {
	@inject(Identifiers.Application)
	private readonly app!: Contracts.Kernel.Application;

	@inject(Identifiers.BlockchainService)
	private readonly blockchain!: Contracts.Blockchain.Blockchain;

	@inject(Identifiers.Cryptography.Configuration)
	private readonly configuration!: Contracts.Crypto.IConfiguration;

	@inject(Identifiers.Cryptography.Block.Deserializer)
	private readonly deserializer!: Contracts.Crypto.IBlockDeserializer;

	@inject(Identifiers.Cryptography.Time.Slots)
	private readonly slots: any;

	public async handle(message: IMessage): Promise<{ status: boolean; height: number }> {
		const blockBuffer: Buffer = Buffer.from(decodeMessage<Uint8Array>(message));

		const deserializedHeader = await this.deserializer.deserialize(blockBuffer, true);

		if (deserializedHeader.data.numberOfTransactions > this.configuration.getMilestone().block.maxTransactions) {
			throw new Exceptions.TooManyTransactionsError(deserializedHeader.data);
		}

		const deserialized: {
			data: Contracts.Crypto.IBlockData;
			transactions: Contracts.Crypto.ITransaction[];
		} = await this.deserializer.deserialize(blockBuffer);

		const block: Contracts.Crypto.IBlockData = {
			...deserialized.data,
			transactions: deserialized.transactions.map((tx) => tx.data),
		};

		if (this.blockchain.pingBlock(block)) {
			return { height: this.blockchain.getLastHeight(), status: true };
		}

		const lastDownloadedBlock: Contracts.Crypto.IBlockData = this.blockchain.getLastDownloadedBlock();

		const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(
			this.app,
			block.height,
			this.configuration,
		);

		if (!Utils.isBlockChained(lastDownloadedBlock, block, blockTimeLookup, this.slots)) {
			return { height: this.blockchain.getLastHeight(), status: false };
		}

		// this.logger.info(
		// 	`Received new block at height ${block.height.toLocaleString()} with ${Utils.pluralize(
		// 		"transaction",
		// 		block.numberOfTransactions,
		// 		true,
		// 	)} from ${mapAddr(request.info.remoteAddress)}`,
		// );

		await this.blockchain.handleIncomingBlock(block, false);

		return { height: this.blockchain.getLastHeight(), status: true };
	}
}
