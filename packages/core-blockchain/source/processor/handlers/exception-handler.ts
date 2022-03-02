import Contracts, { Crypto, Identifiers } from "@arkecosystem/core-contracts";
import { Container, Utils } from "@arkecosystem/core-kernel";
import { DatabaseInterceptor } from "@arkecosystem/core-state";

import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "../contracts";
import { AcceptBlockHandler } from "./accept-block-handler";

@Container.injectable()
export class ExceptionHandler implements BlockHandler {
	@Container.inject(Identifiers.Application)
	protected readonly app!: Contracts.Kernel.Application;

	@Container.inject(Identifiers.BlockchainService)
	protected readonly blockchain!: Contracts.Blockchain.Blockchain;

	@Container.inject(Identifiers.LogService)
	private readonly logger!: Contracts.Kernel.Logger;

	@Container.inject(Identifiers.DatabaseInterceptor)
	private readonly databaseInterceptor!: DatabaseInterceptor;

	public async execute(block: Crypto.IBlock): Promise<BlockProcessorResult> {
		Utils.assert.defined<string>(block.data.id);

		const id: string = block.data.id;

		// Ensure the block has not been forged yet, as an exceptional block bypasses all other checks.
		const forgedBlock: Crypto.IBlock | undefined = await this.databaseInterceptor.getBlock(id);

		if (forgedBlock || block.data.height !== this.blockchain.getLastBlock().data.height + 1) {
			this.blockchain.resetLastDownloadedBlock();

			return BlockProcessorResult.Rejected;
		}

		this.logger.warning(`Block ${block.data.height.toLocaleString()} (${id}) forcibly accepted.`);

		return this.app.resolve<AcceptBlockHandler>(AcceptBlockHandler).execute(block);
	}
}
