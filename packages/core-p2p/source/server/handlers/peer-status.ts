import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Utils } from "@arkecosystem/core-kernel";
import { FastifyRequest } from "fastify";

@injectable()
export class GetPeerStatusHandler {
	@inject(Identifiers.Application)
	private readonly app!: Contracts.Kernel.Application;

	@inject(Identifiers.BlockchainService)
	private readonly blockchain!: Contracts.Blockchain.Blockchain;

	@inject(Identifiers.Cryptography.Configuration)
	private readonly configuration!: Contracts.Crypto.IConfiguration;

	@inject(Identifiers.Cryptography.Time.Slots)
	private readonly slots!: any;

	public async handle(request: FastifyRequest): Promise<Contracts.P2P.PeerPingResponse> {
		const lastBlock: Contracts.Crypto.IBlock = this.blockchain.getLastBlock();

		const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(
			this.app,
			lastBlock.data.height,
			this.configuration,
		);
		const slotInfo = this.slots.getSlotInfo(blockTimeLookup);

		return {
			// @ts-ignore
			config: {
				network: this.configuration.get("network"),
				version: this.app.version(),
			},
			state: {
				currentSlot: slotInfo.slotNumber,
				forgingAllowed: slotInfo.forgingStatus,
				header: lastBlock.getHeader(),
				height: lastBlock.data.height,
			},
		};
	}
}
