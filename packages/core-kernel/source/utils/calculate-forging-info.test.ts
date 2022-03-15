// import { Interfaces, Managers, Networks } from "@arkecosystem/crypto";
import { describe, Sandbox } from "../../../core-test-framework";
import crypto from "../../../core/bin/config/testnet/crypto.json";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { BlockTimeCalculator } from "@arkecosystem/core-crypto-time/source/block-time-calculator";
import { BlockTimeLookup } from "@arkecosystem/core-crypto-time/source/block-time-lookup";
import { Slots } from "@arkecosystem/core-crypto-time/source/slots";
import { Configuration } from "@arkecosystem/core-crypto-config";

import { calculateForgingInfo, getMilestonesWhichAffectActiveValidatorCount } from "./calculate-forging-info";

const mockGetBlockTimeLookup = (height: number) => {
	switch (height) {
		case 1:
			return 0;
		default:
			throw new Error(`Test scenarios should not hit this line`);
	}
};

describe<{
	sandbox: Sandbox;
	configuration: Configuration;
}>("getMilestonesWhichAffectActiveDelegateCount", ({ afterEach, assert, beforeEach, it }) => {
	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();

		context.configuration = context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration);
	});

	it("should return milestones which changes delegate count", ({ configuration }) => {
		configuration.setConfig({ ...crypto, milestones: [{ height: 1, activeValidators: 4 }] });

		console.log(getMilestonesWhichAffectActiveValidatorCount(configuration));

		const milestones = [
			{ height: 1, activeValidators: 4 },
			{ height: 5, activeValidators: 4 },
			{ height: 9, activeValidators: 8 },
			{ height: 15, activeValidators: 8 },
		];

		const config = { ...crypto, milestones };
		configuration.setConfig({ ...crypto, milestones: milestones });

		assert.length(getMilestonesWhichAffectActiveValidatorCount(configuration), 2);
	});
});

describe<{
	sandbox: Sandbox;
	configuration: Configuration;
	// block: Interfaces.IBlock;
	// config: Interfaces.NetworkConfig;
}>("calculateForgingInfo", ({ afterEach, assert, beforeEach, it, stub }) => {
	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();

		context.configuration = context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration);

		context.sandbox.app
			.bind(Identifiers.Cryptography.Time.BlockTimeCalculator)
			.to(BlockTimeCalculator)
			.inSingletonScope();
		context.sandbox.app.bind(Identifiers.Cryptography.Time.BlockTimeLookup).to(BlockTimeLookup).inSingletonScope();
		context.sandbox.app.bind(Identifiers.Cryptography.Time.Slots).to(Slots).inSingletonScope();
		context.sandbox.app.bind(Identifiers.Database.Service).toConstantValue({});
	});

	// afterEach((context) => {
	// 	Managers.configManager.setConfig(context.config);
	// });

	it("should calculate forgingInfo correctly for fixed block times", async ({ configuration, sandbox }) => {
		const milestones = [{ height: 1, blockTime: 8, activeValidators: 4 }];

		const config = { ...crypto, milestones };
		configuration.setConfig(config);

		const getTimestamp = (seconds = 0): number => config.genesisBlock.timestamp + seconds;

		const expectedResults = [
			{
				height: 1,
				timestamp: 0,
				currentForger: 0,
				nextForger: 1,
				blockTimestamp: getTimestamp(0),
				canForge: true,
			},
			{
				height: 2,
				timestamp: 8,
				currentForger: 1,
				nextForger: 2,
				blockTimestamp: getTimestamp(8),
				canForge: true,
			},
			{
				height: 3,
				timestamp: 16,
				currentForger: 2,
				nextForger: 3,
				blockTimestamp: getTimestamp(16),
				canForge: true,
			},
			{
				height: 4,
				timestamp: 24,
				currentForger: 3,
				nextForger: 0,
				blockTimestamp: getTimestamp(24),
				canForge: true,
			},
			{
				height: 5,
				timestamp: 32,
				currentForger: 0,
				nextForger: 1,
				blockTimestamp: getTimestamp(32),
				canForge: true,
			},
			{
				height: 6,
				timestamp: 40,
				currentForger: 1,
				nextForger: 2,
				blockTimestamp: getTimestamp(40),
				canForge: true,
			},
			{
				height: 7,
				timestamp: 48,
				currentForger: 2,
				nextForger: 3,
				blockTimestamp: getTimestamp(48),
				canForge: true,
			},
			{
				height: 8,
				timestamp: 56,
				currentForger: 3,
				nextForger: 0,
				blockTimestamp: getTimestamp(56),
				canForge: true,
			},
			{
				height: 9,
				timestamp: 64,
				currentForger: 0,
				nextForger: 1,
				blockTimestamp: getTimestamp(64),
				canForge: true,
			},
		];

		const offTimeResults = [
			{ height: 1, timestamp: 7, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: false },
			{ height: 2, timestamp: 15, currentForger: 1, nextForger: 2, blockTimestamp: 8, canForge: false },
		];

		// console.log(await calculateForgingInfo(0, 1, sandbox.app));

		// expectedResults.concat(offTimeResults).forEach((item) => {
		// 	assert.equal(calculateForgingInfo(item.timestamp, item.height, sandbox.app), {
		// 		currentForger: item.currentForger,
		// 		nextForger: item.nextForger,
		// 		blockTimestamp: item.blockTimestamp,
		// 		canForge: item.canForge,
		// 	});
		// });

		for (const item of expectedResults.concat(offTimeResults)) {
			assert.equal(await calculateForgingInfo(item.timestamp, item.height, sandbox.app), {
				currentForger: item.currentForger,
				nextForger: item.nextForger,
				blockTimestamp: item.blockTimestamp,
				canForge: item.canForge,
			});
		}
	});

	// it("should calculate forgingInfo correctly for dynamic block times", async () => {
	// 	const milestones = [
	// 		{ height: 1, blocktime: 8, activeDelegates: 4 },
	// 		{ height: 2, blocktime: 4 },
	// 		{ height: 4, blocktime: 3 },
	// 		{ height: 6, blocktime: 4 },
	// 	];

	// 	const mockGetBlockTimeLookup = (height: number) => {
	// 		switch (height) {
	// 			case 1:
	// 				return 0;
	// 			case 2:
	// 				return 8;
	// 			case 3:
	// 				return 12;
	// 			case 4:
	// 				return 16;
	// 			case 5:
	// 				return 19;
	// 			default:
	// 				throw new Error(`Test scenarios should not hit this line`);
	// 		}
	// 	};

	// 	const config = { ...Networks.devnet, milestones };
	// 	Managers.configManager.setConfig(config);

	// 	const expectedResults = [
	// 		{ height: 1, timestamp: 0, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: true }, // + 8
	// 		{ height: 2, timestamp: 8, currentForger: 1, nextForger: 2, blockTimestamp: 8, canForge: true }, // + 4
	// 		{ height: 3, timestamp: 12, currentForger: 2, nextForger: 3, blockTimestamp: 12, canForge: true },
	// 		{ height: 4, timestamp: 16, currentForger: 3, nextForger: 0, blockTimestamp: 16, canForge: true }, // + 3
	// 		{ height: 5, timestamp: 19, currentForger: 0, nextForger: 1, blockTimestamp: 19, canForge: true },
	// 		{ height: 6, timestamp: 22, currentForger: 1, nextForger: 2, blockTimestamp: 22, canForge: true }, // + 4
	// 		{ height: 7, timestamp: 26, currentForger: 2, nextForger: 3, blockTimestamp: 26, canForge: true },
	// 		{ height: 8, timestamp: 30, currentForger: 3, nextForger: 0, blockTimestamp: 30, canForge: true },
	// 	];

	// 	const offTimeResults = [
	// 		{ height: 1, timestamp: 7, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: false }, // + 8
	// 		{ height: 2, timestamp: 11, currentForger: 1, nextForger: 2, blockTimestamp: 8, canForge: false }, // + 4
	// 		{ height: 3, timestamp: 15, currentForger: 2, nextForger: 3, blockTimestamp: 12, canForge: false },
	// 		{ height: 4, timestamp: 18, currentForger: 3, nextForger: 0, blockTimestamp: 16, canForge: false }, // + 3
	// 		{ height: 5, timestamp: 21, currentForger: 0, nextForger: 1, blockTimestamp: 19, canForge: false },
	// 		{ height: 6, timestamp: 25, currentForger: 1, nextForger: 2, blockTimestamp: 22, canForge: false }, // + 4
	// 		{ height: 7, timestamp: 29, currentForger: 2, nextForger: 3, blockTimestamp: 26, canForge: false },
	// 		{ height: 8, timestamp: 32, currentForger: 3, nextForger: 0, blockTimestamp: 30, canForge: false },
	// 	];

	// 	const missedBlocks = [
	// 		{ height: 2, timestamp: 12, currentForger: 2, nextForger: 3, blockTimestamp: 12, canForge: true }, // + 4
	// 		{ height: 2, timestamp: 16, currentForger: 3, nextForger: 0, blockTimestamp: 16, canForge: true },
	// 		{ height: 2, timestamp: 20, currentForger: 0, nextForger: 1, blockTimestamp: 20, canForge: true },
	// 		{ height: 2, timestamp: 24, currentForger: 1, nextForger: 2, blockTimestamp: 24, canForge: true },

	// 		{ height: 3, timestamp: 16, currentForger: 3, nextForger: 0, blockTimestamp: 16, canForge: true },

	// 		{ height: 6, timestamp: 26, currentForger: 2, nextForger: 3, blockTimestamp: 26, canForge: true },
	// 	];

	// 	expectedResults
	// 		.concat(offTimeResults)
	// 		.concat(missedBlocks)
	// 		.forEach((item) => {
	// 			assert.equal(calculateForgingInfo(item.timestamp, item.height, mockGetBlockTimeLookup), {
	// 				currentForger: item.currentForger,
	// 				nextForger: item.nextForger,
	// 				blockTimestamp: item.blockTimestamp,
	// 				canForge: item.canForge,
	// 			});
	// 		});
	// });

	// it("should calculate forgingInfo correctly for dynamic block times and changing max delegate numbers", async () => {
	// 	const milestones = [
	// 		{ height: 1, blocktime: 4, activeDelegates: 4 },
	// 		{ height: 4, blocktime: 3 },
	// 		{ height: 5, blocktime: 5, activeDelegates: 5 },
	// 	];

	// 	const config = { ...Networks.devnet, milestones };
	// 	stub(Managers.configManager, "validateMilestones").returnValue(true);
	// 	Managers.configManager.setConfig(config);
	// 	Managers.configManager.setConfig(config);

	// 	const mockGetBlockTimeLookup = (height: number) => {
	// 		switch (height) {
	// 			case 1:
	// 				return 0;
	// 			case 3:
	// 				return 8;
	// 			case 4:
	// 				return 12;
	// 			default:
	// 				throw new Error(`Test scenarios should not hit this line`);
	// 		}
	// 	};

	// 	const expectedResults = [
	// 		{ height: 1, timestamp: 0, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: true }, // + 8
	// 		{ height: 2, timestamp: 4, currentForger: 1, nextForger: 2, blockTimestamp: 4, canForge: true },
	// 		{ height: 3, timestamp: 8, currentForger: 2, nextForger: 3, blockTimestamp: 8, canForge: true },
	// 		{ height: 4, timestamp: 12, currentForger: 3, nextForger: 0, blockTimestamp: 12, canForge: true },
	// 		{ height: 5, timestamp: 15, currentForger: 0, nextForger: 1, blockTimestamp: 15, canForge: true },
	// 		{ height: 6, timestamp: 20, currentForger: 1, nextForger: 2, blockTimestamp: 20, canForge: true },
	// 		{ height: 7, timestamp: 25, currentForger: 2, nextForger: 3, blockTimestamp: 25, canForge: true },
	// 		{ height: 8, timestamp: 30, currentForger: 3, nextForger: 4, blockTimestamp: 30, canForge: true },
	// 		{ height: 9, timestamp: 35, currentForger: 4, nextForger: 0, blockTimestamp: 35, canForge: true },
	// 		{ height: 10, timestamp: 40, currentForger: 0, nextForger: 1, blockTimestamp: 40, canForge: true },
	// 	];

	// 	const offTimeResults = [
	// 		{ height: 1, timestamp: 3, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: false },
	// 		{ height: 2, timestamp: 7, currentForger: 1, nextForger: 2, blockTimestamp: 4, canForge: false },
	// 		{ height: 3, timestamp: 11, currentForger: 2, nextForger: 3, blockTimestamp: 8, canForge: false },
	// 		{ height: 4, timestamp: 14, currentForger: 3, nextForger: 0, blockTimestamp: 12, canForge: false },
	// 		{ height: 5, timestamp: 19, currentForger: 0, nextForger: 1, blockTimestamp: 15, canForge: false },
	// 		{ height: 6, timestamp: 24, currentForger: 1, nextForger: 2, blockTimestamp: 20, canForge: false },
	// 		{ height: 7, timestamp: 29, currentForger: 2, nextForger: 3, blockTimestamp: 25, canForge: false },
	// 		{ height: 8, timestamp: 34, currentForger: 3, nextForger: 4, blockTimestamp: 30, canForge: false },
	// 		{ height: 9, timestamp: 39, currentForger: 4, nextForger: 0, blockTimestamp: 35, canForge: false },
	// 		{ height: 10, timestamp: 44, currentForger: 0, nextForger: 1, blockTimestamp: 40, canForge: false },
	// 	];

	// 	const missedBlocks = [
	// 		{ height: 2, timestamp: 8, currentForger: 2, nextForger: 3, blockTimestamp: 8, canForge: true },
	// 		{ height: 2, timestamp: 12, currentForger: 3, nextForger: 0, blockTimestamp: 12, canForge: true },
	// 		{ height: 2, timestamp: 16, currentForger: 0, nextForger: 1, blockTimestamp: 16, canForge: true },

	// 		{ height: 4, timestamp: 15, currentForger: 0, nextForger: 1, blockTimestamp: 15, canForge: true },
	// 		{ height: 4, timestamp: 18, currentForger: 1, nextForger: 2, blockTimestamp: 18, canForge: true },

	// 		{ height: 5, timestamp: 20, currentForger: 1, nextForger: 2, blockTimestamp: 20, canForge: true },
	// 		{ height: 5, timestamp: 25, currentForger: 2, nextForger: 3, blockTimestamp: 25, canForge: true },
	// 		{ height: 5, timestamp: 30, currentForger: 3, nextForger: 4, blockTimestamp: 30, canForge: true },
	// 		{ height: 5, timestamp: 35, currentForger: 4, nextForger: 0, blockTimestamp: 35, canForge: true },
	// 	];

	// 	expectedResults
	// 		.concat(offTimeResults)
	// 		.concat(missedBlocks)
	// 		.forEach((item) => {
	// 			assert.equal(calculateForgingInfo(item.timestamp, item.height, mockGetBlockTimeLookup), {
	// 				currentForger: item.currentForger,
	// 				nextForger: item.nextForger,
	// 				blockTimestamp: item.blockTimestamp,
	// 				canForge: item.canForge,
	// 			});
	// 		});
	// });
});
