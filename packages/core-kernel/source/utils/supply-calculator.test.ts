import { Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import { describe } from "../../../core-test-framework";

import { calculate } from "./supply-calculator";

const toString = (value) => Utils.BigNumber.make(value).toFixed();

describe<{
	config: Interfaces.NetworkConfig;
	mockConfig: any;
}>("Supply calculator", ({ afterEach, beforeEach, assert, it }) => {
	beforeEach((context) => {
		context.config = Managers.configManager.all();

		context.mockConfig = {
			genesisBlock: { totalAmount: 1000 },
			milestones: [{ height: 1, reward: 2 }],
		};

		Managers.configManager.set("genesisBlock", context.mockConfig.genesisBlock);
		Managers.configManager.set("milestones", context.mockConfig.milestones);
	});
	afterEach((context) => {
		Managers.configManager.setConfig(context.config);
	});

	it("should calculate supply with milestone at height 2", (context) => {
		context.mockConfig.milestones[0].height = 2;

		assert.is(calculate(1), toString(context.mockConfig.genesisBlock.totalAmount));
	});

	for (const height of [0, 5, 100, 2000, 4000, 8000]) {
		it(`at height ${height} should calculate the genesis supply without milestone`, (context) => {
			const genesisSupply = context.mockConfig.genesisBlock.totalAmount;
			assert.is(calculate(height), toString(genesisSupply + height * context.mockConfig.milestones[0].reward));
		});
	}

	for (const height of [0, 2000, 4000, 8000, 16000]) {
		it(`at height ${height} should calculate the genesis supply with one milestone`, (context) => {
			context.mockConfig.milestones.push({ height: 8000, reward: 3 });

			const reward = (current) => {
				if (current < 8000) {
					return current * 2;
				}

				return 7999 * 2 + (current - 7999) * 3;
			};

			const genesisSupply = context.mockConfig.genesisBlock.totalAmount;

			assert.is(calculate(height), toString(genesisSupply + reward(height)));
		});
	}

	for (const height of [0, 4000, 8000, 12000, 16000, 20000, 32000, 48000, 64000, 128000]) {
		it(`at height ${height} should calculate the genesis supply with four milestones`, (context) => {
			context.mockConfig.milestones.push({ height: 8000, reward: 4 });
			context.mockConfig.milestones.push({ height: 16000, reward: 5 });
			context.mockConfig.milestones.push({ height: 32000, reward: 10 });
			context.mockConfig.milestones.push({ height: 64000, reward: 15 });

			const reward = (current) => {
				if (current < 8000) {
					return current * 2;
				}

				if (current < 16000) {
					return reward(7999) + (current - 7999) * 4;
				}

				if (current < 32000) {
					return reward(15999) + (current - 15999) * 5;
				}

				if (current < 64000) {
					return reward(31999) + (current - 31999) * 10;
				}

				return reward(63999) + (current - 63999) * 15;
			};

			const genesisSupply = context.mockConfig.genesisBlock.totalAmount;

			assert.is(calculate(height), toString(genesisSupply + reward(height)));
		});
	}
});
