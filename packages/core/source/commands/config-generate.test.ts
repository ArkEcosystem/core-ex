import { Console, describe } from "@arkecosystem/core-test-framework";
import { BigNumber } from "@arkecosystem/utils";
import envPaths from "env-paths";
import fs from "fs-extra";
import { join } from "path";
import prompts from "prompts";

import { Command } from "./config-generate";

describe<{
	cli: Console;
}>("ConfigGenerateCommand", ({ beforeEach, it, stub, assert, match }) => {
	const paths = envPaths("myn", { suffix: "core" });
	const configCore = join(paths.config, "testnet");
	const configCrypto = join(configCore, "crypto");

	beforeEach((context) => {
		context.cli = new Console();
	});

	it("should generate a new configuration", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				blockTime: "9",
				maxBlockPayload: "123444",
				maxTxPerBlock: "122",
				explorer: "myex.io",
				network: "testnet",
				distribute: "true",
				premine: "12500000000000000",
				pubKeyHash: "168",
				rewardAmount: "200000000",
				rewardHeight: "23000",
				symbol: "my",
				token: "myn",
				validators: "51",
				wif: "27",
			})
			.execute(Command);

		existsSync.calledWith(configCore);

		ensureDirSync.calledWith(configCore);

		writeJSONSync.calledTimes(5);
		writeFileSync.calledOnce();

		writeJSONSync.calledWith(
			match("crypto.json"),
			match({
				genesisBlock: {
					height: 1,
					blockSignature: match.string,
					numberOfTransactions: 153,
					generatorPublicKey: match.string,
					payloadHash: match.string,
					id: match.string,
					previousBlock: "0000000000000000000000000000000000000000000000000000000000000000",
					payloadLength: 4896,
					timestamp: match.number,
					reward: BigNumber.ZERO,
					version: 1,
					totalAmount: BigNumber.make("12499999999999986"),
					totalFee: BigNumber.ZERO,
					transactions: match.array,
				},
				milestones: [
					match({
						activeValidators: 51,
						address: match.object,
						block: match.object,
						blockTime: 9,
						epoch: match.string,
						height: 1,
						multiPaymentLimit: 256,
						reward: "0", // TODO: Check
						satoshi: match.object,
						vendorFieldLength: 255,
					}),
					match({
						activeValidators: 51,
						address: match.object,
						block: match.object,
						blockTime: 9,
						epoch: match.string,
						height: 23_000,
						multiPaymentLimit: 256,
						reward: 200_000_000,
						satoshi: match.object,
						vendorFieldLength: 255,
					}),
				],
				network: {
					client: { explorer: "myex.io", symbol: "my", token: "myn" },
					messagePrefix: "testnet message:\n",
					name: "testnet",
					nethash: match.string,
					pubKeyHash: 168,
					slip44: 1,
					wif: 27,
				},
			}),
			{ spaces: 4 },
		);
	});

	it.skip("should throw if the core configuration destination already exists", async ({ cli }) => {
		stub(fs, "existsSync").returnValueOnce(true);

		await assert.rejects(
			() =>
				cli
					.withFlags({
						blockTime: "9",
						maxBlockPayload: "123444",
						maxTxPerBlock: "122",
						explorer: "myex.io",
						network: "testnet",
						distribute: "true",
						premine: "12500000000000000",
						pubKeyHash: "168",
						rewardAmount: "200000000",
						rewardHeight: "23000",
						symbol: "my",
						token: "myn",
						validators: "51",
						wif: "27",
					})
					.execute(Command),
			`${configCore} already exists.`,
		);
	});

	it.skip("should throw if the crypto configuration destination already exists", async ({ cli }) => {
		const retunValues = [false, true];
		stub(fs, "existsSync").callsFake(() => retunValues.shift());

		await assert.rejects(
			() =>
				cli
					.withFlags({
						blocktime: "9",
						delegates: "47",
						distribute: "true",
						explorer: "myex.io",
						maxBlockPayload: "123444",
						maxTxPerBlock: "122",
						network: "testnet",
						premine: "120000000000",
						pubKeyHash: "168",
						rewardAmount: "66000",
						rewardHeight: "23000",
						symbol: "my",
						token: "myn",
						wif: "27",
					})
					.execute(Command),
			`${configCrypto} already exists.`,
		);
	});

	it("should throw if the properties are not confirmed", async ({ cli }) => {
		prompts.inject([
			"testnet",
			"120000000000",
			"47",
			"9",
			"122",
			"123444",
			"23000",
			"66000",
			"168",
			"27",
			"myn",
			"my",
			"myex.io",
			true,
			false,
		]);

		await assert.rejects(() => cli.execute(Command), "You'll need to confirm the input to continue.");
	});

	it("should throw if string property is undefined", async ({ cli }) => {
		prompts.inject([
			"undefined",
			"120000000000",
			"47",
			"9",
			"122",
			"123444",
			"23000",
			"66000",
			"168",
			"27",
			"myn",
			"m",
			"myex.io",
			true,
			true,
		]);

		await assert.rejects(() => cli.execute(Command), "Flag network is required.");
	});

	it("should throw if numeric property is Nan", async ({ cli }) => {
		prompts.inject([
			"testnet",
			"120000000000",
			"47",
			"9",
			"122",
			"123444",
			"23000",
			"66000",
			"168",
			Number.NaN,
			"myn",
			"m",
			"myex.io",
			true,
			true,
		]);

		await assert.rejects(() => cli.execute(Command), "Flag wif is required.");
	});

	it("should generate a new configuration if the properties are confirmed", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		prompts.inject([
			"testnet",
			"12500000000000000",
			"51",
			"9",
			"122",
			123_444,
			"23000",
			"200000000",
			168,
			"27",
			"myn",
			"my",
			"myex.io",
			true,
			true,
		]);

		await cli.execute(Command);

		existsSync.calledWith(configCore);
		ensureDirSync.calledWith(configCore);
		writeJSONSync.calledTimes(5);
		writeFileSync.calledOnce();
	});

	it("should generate a new configuration if the properties are confirmed and distribute is set to false", async ({
		cli,
	}) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		prompts.inject([
			"testnet",
			"120000000000",
			"47",
			"9",
			"122",
			123_444,
			"23000",
			"66000",
			168,
			"27",
			"myn",
			"my",
			"myex.io",
			false,
			true,
		]);

		await cli.withFlags({ distribute: false }).execute(Command);

		existsSync.calledWith(configCore);
		ensureDirSync.calledWith(configCore);
		writeJSONSync.calledTimes(5);
		writeFileSync.calledOnce();
	});

	it("should generate a new configuration with additional flags", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				blockTime: "9",
				distribute: "true",
				epoch: new Date("2020-11-04T00:00:00.000Z"),
				explorer: "myex.io",
				coreAPIPort: 3003,
				feeDynamicBytesDelegateRegistration: 3,
				feeDynamicBytesDelegateResignation: 8,
				feeDynamicBytesMultiSignature: 5,
				coreMonitorPort: 3005,
				feeDynamicEnabled: true,
				coreP2PPort: 3002,
				validators: "47",
				coreWebhooksPort: 3004,
				feeDynamicMinFeeBroadcast: 200,
				feeDynamicBytesMultiPayment: 7,
				feeStaticDelegateRegistration: 3,
				feeDynamicBytesTransfer: 1,
				feeStaticDelegateResignation: 8,
				feeDynamicBytesVote: 4,
				maxBlockPayload: "123444",
				feeDynamicMinFeePool: 100,
				maxTxPerBlock: "122",
				feeStaticMultiPayment: 7,
				network: "testnet",
				feeStaticMultiSignature: 5,
				premine: "120000000000",
				feeStaticTransfer: 1,
				pubKeyHash: "168",
				feeStaticVote: 4,
				rewardAmount: "66000",
				peers: "127.0.0.1:4444,127.0.0.2",
				rewardHeight: "23000",
				symbol: "my",
				token: "myn",
				vendorFieldLength: "64",
				wif: "27",
			})
			.execute(Command);

		existsSync.calledWith(configCore);
		ensureDirSync.calledWith(configCore);
		writeJSONSync.calledTimes(5);
		writeFileSync.calledOnce();

		writeJSONSync.calledWith(
			match("crypto.json"),
			match({
				genesisBlock: {
					height: 1,
					blockSignature: match.string,
					numberOfTransactions: 141,
					generatorPublicKey: match.string,
					payloadHash: match.string,
					id: match.string,
					previousBlock: "0000000000000000000000000000000000000000000000000000000000000000",
					payloadLength: 4512,
					timestamp: match.number,
					reward: BigNumber.ZERO,
					version: 1,
					totalAmount: BigNumber.make("119999999983"),
					totalFee: BigNumber.ZERO,
					transactions: match.array,
				},
				milestones: [
					match({
						activeValidators: 47,
						address: match.object,
						block: match.object,
						blockTime: 9,
						epoch: match.string,
						height: 1,
						multiPaymentLimit: 256,
						reward: "0", // TODO: Check
						satoshi: match.object,
						vendorFieldLength: 64,
					}),
					match({
						activeValidators: 47,
						address: match.object,
						block: match.object,
						blockTime: 9,
						epoch: match.string,
						height: 23_000,
						multiPaymentLimit: 256,
						reward: 66_000,
						satoshi: match.object,
						vendorFieldLength: 64,
					}),
				],
				network: {
					client: { explorer: "myex.io", symbol: "my", token: "myn" },
					messagePrefix: "testnet message:\n",
					name: "testnet",
					nethash: match.string,
					pubKeyHash: 168,
					slip44: 1,
					wif: 27,
				},
			}),
			{ spaces: 4 },
		);
	});

	it("should generate a new configuration using force option", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				force: true,
				token: "myn",
			})
			.execute(Command);

		existsSync.calledWith(configCore);
		ensureDirSync.calledWith(configCore);
		writeJSONSync.calledTimes(5);
		writeFileSync.calledOnce();
	});

	it("should overwrite if overwriteConfig is set", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				blockTime: "9",
				maxBlockPayload: "123444",
				maxTxPerBlock: "122",
				network: "testnet",
				explorer: "myex.io",
				overwriteConfig: "true",
				distribute: "true",
				premine: "12500000000000000",
				pubKeyHash: "168",
				rewardAmount: "200000000",
				rewardHeight: "23000",
				symbol: "my",
				token: "myn",
				validators: "51",
				wif: "27",
			})
			.execute(Command);

		existsSync.neverCalled();
		ensureDirSync.calledWith(configCore);
		writeJSONSync.calledTimes(5);
		writeFileSync.calledOnce();
	});

	it("should generate crypto on custom path", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				blockTime: "9",
				configPath: "/path/to/config",
				maxBlockPayload: "123444",
				maxTxPerBlock: "122",
				explorer: "myex.io",
				network: "testnet",
				distribute: "true",
				premine: "12500000000000000",
				pubKeyHash: "168",
				rewardAmount: "200000000",
				rewardHeight: "23000",
				symbol: "my",
				token: "myn",
				validators: "51",
				wif: "27",
			})
			.execute(Command);

		existsSync.calledWith("/path/to/config/testnet");
		ensureDirSync.calledWith("/path/to/config/testnet");
		writeJSONSync.calledTimes(5);
		writeFileSync.calledOnce();
	});

	it.skip("should allow empty peers", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				blockTime: "9",
				maxBlockPayload: "123444",
				maxTxPerBlock: "122",
				network: "testnet",
				explorer: "myex.io",
				peers: "",
				distribute: "true",
				premine: "12500000000000000",
				pubKeyHash: "168",
				rewardAmount: "200000000",
				rewardHeight: "23000",
				symbol: "my",
				token: "myn",
				validators: "51",
				wif: "27",
			})
			.execute(Command);

		existsSync.calledWith("/path/to/config/testnet");
		ensureDirSync.calledWith("/path/to/config/testnet");
		writeJSONSync.calledTimes(5);
		writeFileSync.calledOnce();
	});
});
