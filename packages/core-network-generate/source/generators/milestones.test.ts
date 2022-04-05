import { dirSync, setGracefulCleanup } from "tmp";

import { describe } from "../../../core-test-framework/distribution";
import { MilestonesGenerator } from "./milestones";

describe<{
	dataPath: string;
	generator: MilestonesGenerator;
}>("App generator", ({ it, assert, beforeEach, beforeAll }) => {
	beforeAll(() => {
		setGracefulCleanup();
	});

	beforeEach((context) => {
		context.dataPath = dirSync().name;
		context.generator = new MilestonesGenerator();
	});

	it("#get - should return data", ({ generator }) => {
		assert.equal(generator.get(), []);
	});

	it("#setInitial - should set initial milestone", ({ generator }) => {
		const date = new Date();

		assert.equal(
			generator
				.setInitial({
					validators: 51,
					maxBlockPayload: 2000,
					maxTxPerBlock: 100,
					blockTime: 8,
					epoch: date,
					vendorFieldLength: 255,
				})
				.get(),
			[
				{
					activeValidators: 51,
					address: {
						bech32m: "ark",
					},
					block: {
						maxPayload: 2000,
						maxTransactions: 100,
						version: 1,
					},
					blockTime: 8,
					epoch: date.toISOString(),
					height: 1,
					multiPaymentLimit: 256,
					reward: "0",
					satoshi: {
						decimals: 8,
						denomination: 1e8,
					},
					vendorFieldLength: 255,
				},
			],
		);
	});

	it("#setReward - should set reward", ({ generator, dataPath }) => {
		assert.equal(generator.setReward(3, "200").get(), [
			{
				height: 3,
				reward: "200",
			},
		]);
	});
});
