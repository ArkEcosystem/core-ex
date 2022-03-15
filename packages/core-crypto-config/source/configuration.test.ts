import { configManager } from "./";
import { devnet, testnet, mainnet } from "../networks";
import { describe } from "@arkecosystem/core-test-framework";

describe<{
	config: any;
}>("Configuration", ({ it, beforeEach, afterEach, assert }) => {
	beforeEach((context) => {
		context.config = configManager.all();

		configManager.setConfig(devnet);
	});

	afterEach((context) => configManager.setConfig(context.config));

	it("should be instantiated", () => {
		assert.object(configManager);
	});

	it("should be set on runtime", () => {
		configManager.setConfig(mainnet);

		assert.containKeys(configManager.all(), ["network", "milestones", "exceptions", "genesisBlock"]);
	});

	it('key should be "set"', () => {
		configManager.set("key", "value");

		assert.equal(configManager.get("key"), "value");
	});

	it('key should be "get"', () => {
		assert.equal(
			configManager.get("network.nethash"),
			"2a44f340d76ffc3df204c5f38cd355b7496c9065a1ade2ef92071436bd72e867",
		);
	});

	it("should build milestones", () => {
		assert.equal(configManager.getMilestones(), devnet.milestones);
	});

	it('should build milestones without concatenating the "minimumVersions" array', () => {
		const milestones = devnet.milestones.sort((a, b) => a.height - b.height);
		configManager.setHeight(milestones[0].height);

		const lastMilestone = milestones.find((milestone) => !!milestone.p2p && !!milestone.p2p.minimumVersions);

		if (lastMilestone && lastMilestone.p2p && configManager.getMilestone().p2p) {
			assert.equal(configManager.getMilestone().p2p.minimumVersions, lastMilestone.p2p.minimumVersions);
		}
	});

	it("should get milestone for height", () => {
		assert.equal(configManager.getMilestone(21600), devnet.milestones[2]);
	});

	it("should get milestone for this.height if height is not provided as parameter", () => {
		configManager.setHeight(21600);

		assert.equal(configManager.getMilestone(), devnet.milestones[2]);
	});

	it("should set the height", () => {
		configManager.setHeight(21600);

		assert.equal(configManager.getHeight(), 21600);
	});

	it("should determine if a new milestone is becoming active", () => {
		for (const milestone of devnet.milestones) {
			configManager.setHeight(milestone.height);
			assert.true(configManager.isNewMilestone());
		}

		configManager.setHeight(999999);
		assert.false(configManager.isNewMilestone());

		configManager.setHeight(1);
		assert.false(configManager.isNewMilestone(999999));
	});

	it("getNextMilestoneByKey - should throw an error if no milestones are set", () => {
		configManager.setConfig({ ...devnet, milestones: [] });
		assert.throws(
			() => configManager.getNextMilestoneWithNewKey(1, "blocktime"),
			`Attempted to get next milestone but none were set`,
		);
	});

	it("getNextMilestoneByKey - should get the next milestone with a given key", () => {
		configManager.setConfig(devnet);
		const expected = {
			found: true,
			height: 1750000,
			data: 255,
		};
		assert.equal(configManager.getNextMilestoneWithNewKey(1, "vendorFieldLength"), expected);
	});

	it("getNextMilestoneByKey - should return empty result if no next milestone is found", () => {
		configManager.setConfig(devnet);
		const expected = {
			found: false,
			height: 1750000,
			data: null,
		};
		assert.equal(configManager.getNextMilestoneWithNewKey(1750000, "vendorFieldLength"), expected);
	});

	it("getNextMilestoneByKey - should get all milestones", () => {
		const milestones = [
			{ height: 1, blocktime: 8 },
			{ height: 3, blocktime: 9 },
			{ height: 6, blocktime: 10 },
			{ height: 8, blocktime: 8 },
		];
		const config = { ...devnet, milestones };
		configManager.setConfig(config);
		const secondMilestone = {
			found: true,
			height: 3,
			data: 9,
		};
		const thirdMilestone = {
			found: true,
			height: 6,
			data: 10,
		};
		const fourthMilestone = {
			found: true,
			height: 8,
			data: 8,
		};
		const emptyMilestone = {
			found: false,
			height: 8,
			data: null,
		};
		assert.equal(configManager.getNextMilestoneWithNewKey(1, "blocktime"), secondMilestone);
		assert.equal(configManager.getNextMilestoneWithNewKey(3, "blocktime"), thirdMilestone);
		assert.equal(configManager.getNextMilestoneWithNewKey(4, "blocktime"), thirdMilestone);
		assert.equal(configManager.getNextMilestoneWithNewKey(6, "blocktime"), fourthMilestone);
		assert.equal(configManager.getNextMilestoneWithNewKey(8, "blocktime"), emptyMilestone);
	});
});