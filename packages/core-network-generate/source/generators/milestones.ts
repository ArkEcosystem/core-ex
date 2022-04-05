import { Contracts } from "@arkecosystem/core-contracts";

export class MilestonesGenerator {
	#data = [];

	get(): string[] {
		return this.#data;
	}

	setInitial(options: Contracts.NetworkGenerator.MilestoneOptions): MilestonesGenerator {
		this.#data = [
			{
				activeValidators: options.validators,
				address: {
					bech32m: "ark",
				},
				block: {
					maxPayload: options.maxBlockPayload,
					maxTransactions: options.maxTxPerBlock,
					version: 1,
				},
				blockTime: options.blockTime,
				epoch: options.epoch.toISOString(),
				height: 1,
				multiPaymentLimit: 256,
				reward: "0",
				satoshi: {
					decimals: 8,
					denomination: 1e8,
				},
				vendorFieldLength: options.vendorFieldLength,
			},
		];

		return this;
	}

	setReward(height: number, reward: string): MilestonesGenerator {
		this.#data.push({
			height,
			reward,
		});

		return this;
	}
}
