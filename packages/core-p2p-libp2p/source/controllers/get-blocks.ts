import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { DatabaseService } from "@arkecosystem/core-database";

import { IMessage } from "../contracts";
import { decodeMessage } from "../utils";

@injectable()
export class GetBlocksHandler {
	@inject(Identifiers.BlockchainService)
	private readonly blockchain!: Contracts.Blockchain.Blockchain;

	@inject(Identifiers.DatabaseService)
	private readonly database!: DatabaseService;

	public async handle(message: IMessage): Promise<Contracts.Crypto.IBlockData[] | Contracts.Shared.DownloadBlock[]> {
		const payload: {
			lastBlockHeight: number;
			blockLimit: number;
			headersOnly: boolean;
		} = decodeMessage(message);

		const requestBlockHeight: number = +payload.lastBlockHeight + 1;
		const requestBlockLimit: number = +payload.blockLimit || 400;
		const requestHeadersOnly = !!payload.headersOnly;

		const lastHeight: number = this.blockchain.getLastHeight();
		if (requestBlockHeight > lastHeight) {
			return [];
		}

		const blocks: Contracts.Shared.DownloadBlock[] = await this.database.getBlocksForDownload(
			requestBlockHeight,
			requestBlockLimit,
			requestHeadersOnly,
		);

		// Only return the blocks fetched while we are below the p2p maxPayload limit
		const blocksToReturn: Contracts.Shared.DownloadBlock[] = [];
		// 100KB margin because we're dealing with estimates
		const maxPayloadWithMargin = 0; // constants.DEFAULT_MAX_PAYLOAD - 100 * 1024;
		for (let index = 0, sizeEstimate = 0; sizeEstimate < maxPayloadWithMargin && index < blocks.length; index++) {
			blocksToReturn.push(blocks[index]);
			sizeEstimate +=
				blocks[index].transactions?.reduce((accumulator, current) => accumulator + current.length, 0) ?? 0;
			// We estimate the size of each block -- as it will be sent through p2p -- with the length of the
			// associated transactions. When blocks are big, size of the block header is negligible compared to its
			// transactions. And here we just want a broad limit to stop when getting close to p2p max payload.
		}

		// this.logger.info(
		// 	`${mapAddr(request.info.remoteAddress)} has downloaded ${Utils.pluralize(
		// 		"block",
		// 		blocksToReturn.length,
		// 		true,
		// 	)} from height ${requestBlockHeight.toLocaleString()}`,
		// );

		return blocksToReturn;
	}
}
