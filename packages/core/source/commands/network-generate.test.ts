import { Console, describe } from "@arkecosystem/core-test-framework";
import { Command } from "./network-generate";
import envPaths from "env-paths";
import fs from "fs-extra";
import { join } from "path";
import prompts from "prompts";

describe<{
	cli: Console;
}>("GenerateCommand", ({ beforeEach, it, stub, assert }) => {
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
				network: "testnet",
				premine: "120000000000",
				delegates: "47",
				blocktime: "9",
				maxTxPerBlock: "122",
				maxBlockPayload: "123444",
				rewardHeight: "23000",
				rewardAmount: "66000",
				pubKeyHash: "168",
				wif: "27",
				token: "myn",
				symbol: "my",
				explorer: "myex.io",
				distribute: "true",
			})
			.execute(Command);

		existsSync.calledWith(configCore);
		existsSync.calledWith(configCrypto);

		ensureDirSync.calledWith(configCore);
		ensureDirSync.calledWith(configCrypto);

		writeJSONSync.calledTimes(8); // 5x Core + 2x Crypto + App
		writeFileSync.calledTimes(2); // index.ts && .env

		const callArgs = writeJSONSync.getCallArgs(2);
		assert.true(callArgs[0].includes("crypto/milestones.json"));

		// TODO: later
		// writeJSONSync.calledWith(
		// 	expect.stringContaining("crypto/milestones.json"),
		// 	[
		// 		{
		// 			height: 1,
		// 			reward: "0",
		// 			activeDelegates: 47,
		// 			blocktime: 9,
		// 			block: {
		// 				version: 0,
		// 				idFullSha256: true,
		// 				maxTransactions: 122,
		// 				maxPayload: 123444,
		// 			},
		// 			epoch: expect.any(String),
		// 			fees: {
		// 				staticFees: {
		// 					transfer: 10000000,
		// 					delegateRegistration: 2500000000,
		// 					vote: 100000000,
		// 					multiSignature: 500000000,
		// 					multiPayment: 10000000,
		// 					delegateResignation: 2500000000,
		// 				},
		// 			},
		// 			vendorFieldLength: 255,
		// 			multiPaymentLimit: 256,
		// 			aip11: true,
		// 		},
		// 		{
		// 			height: 23000,
		// 			reward: 66000,
		// 		},
		// 	],
		// 	{ spaces: 4 },
		// );
	});

	it("should throw if the core configuration destination already exists", async ({ cli }) => {
		stub(fs, "existsSync").returnValueOnce(true);

		await assert.rejects(
			() =>
				cli
					.withFlags({
						network: "testnet",
						premine: "120000000000",
						delegates: "47",
						blocktime: "9",
						maxTxPerBlock: "122",
						maxBlockPayload: "123444",
						rewardHeight: "23000",
						rewardAmount: "66000",
						pubKeyHash: "168",
						wif: "27",
						token: "myn",
						symbol: "my",
						explorer: "myex.io",
						distribute: "true",
					})
					.execute(Command),
			`${configCore} already exists.`,
		);
	});

	it("should throw if the crypto configuration destination already exists", async ({ cli }) => {
		const retunValues = [false, true];
		stub(fs, "existsSync").callsFake(() => retunValues.shift());

		await assert.rejects(
			() =>
				cli
					.withFlags({
						network: "testnet",
						premine: "120000000000",
						delegates: "47",
						blocktime: "9",
						maxTxPerBlock: "122",
						maxBlockPayload: "123444",
						rewardHeight: "23000",
						rewardAmount: "66000",
						pubKeyHash: "168",
						wif: "27",
						token: "myn",
						symbol: "my",
						explorer: "myex.io",
						distribute: "true",
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
			"120000000000",
			"47",
			"9",
			"122",
			"123444",
			"23000",
			"66000",
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
		existsSync.calledWith(configCrypto);
		ensureDirSync.calledWith(configCore);
		ensureDirSync.calledWith(configCrypto);
		writeJSONSync.calledTimes(8); // 5x Core + 2x Crypto + App
		writeFileSync.calledTimes(2); // index.ts && .env
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
			"123444",
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
		existsSync.calledWith(configCrypto);
		ensureDirSync.calledWith(configCore);
		ensureDirSync.calledWith(configCrypto);
		writeJSONSync.calledTimes(8); // 5x Core + 2x Crypto + App
		writeFileSync.calledTimes(2); // index.ts && .env
	});

	it("should generate a new configuration with additional flags", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				network: "testnet",
				premine: "120000000000",
				delegates: "47",
				blocktime: "9",
				maxTxPerBlock: "122",
				maxBlockPayload: "123444",
				rewardHeight: "23000",
				rewardAmount: "66000",
				pubKeyHash: "168",
				vendorFieldLength: "64",
				wif: "27",
				token: "myn",
				symbol: "my",
				explorer: "myex.io",
				distribute: "true",
				epoch: "2020-11-04T00:00:00.000Z",
				feeStaticTransfer: 1,
				feeStaticDelegateRegistration: 3,
				feeStaticVote: 4,
				feeStaticMultiSignature: 5,
				feeStaticMultiPayment: 7,
				feeStaticDelegateResignation: 8,
				feeDynamicEnabled: true,
				feeDynamicMinFeePool: 100,
				feeDynamicMinFeeBroadcast: 200,
				feeDynamicBytesTransfer: 1,
				feeDynamicBytesDelegateRegistration: 3,
				feeDynamicBytesVote: 4,
				feeDynamicBytesMultiSignature: 5,
				feeDynamicBytesMultiPayment: 7,
				feeDynamicBytesDelegateResignation: 8,
				coreDBHost: "127.0.0.1",
				coreDBPort: 3001,
				coreDBUsername: "username",
				coreDBPassword: "password",
				coreDBDatabase: "database",
				coreP2PPort: 3002,
				coreAPIPort: 3003,
				coreWebhooksPort: 3004,
				coreMonitorPort: 3005,
				peers: "127.0.0.1:4444,127.0.0.2",
			})
			.execute(Command);

		existsSync.calledWith(configCore);
		existsSync.calledWith(configCrypto);
		ensureDirSync.calledWith(configCore);
		ensureDirSync.calledWith(configCrypto);
		writeJSONSync.calledTimes(8); // 5x Core + 2x Crypto + App
		writeFileSync.calledTimes(2); // index.ts && .env

		// TODO: later
		// expect(writeJSONSync).toHaveBeenCalledWith(
		// 	expect.stringContaining("crypto/milestones.json"),
		// 	[
		// 		{
		// 			height: 1,
		// 			reward: "0",
		// 			activeDelegates: 47,
		// 			blocktime: 9,
		// 			block: {
		// 				version: 0,
		// 				idFullSha256: true,
		// 				maxTransactions: 122,
		// 				maxPayload: 123444,
		// 			},
		// 			epoch: "2020-11-04T00:00:00.000Z",
		// 			fees: {
		// 				staticFees: {
		// 					transfer: 1,
		// 					delegateRegistration: 3,
		// 					vote: 4,
		// 					multiSignature: 5,
		// 					multiPayment: 7,
		// 					delegateResignation: 8,
		// 				},
		// 			},
		// 			vendorFieldLength: 64,
		// 			multiPaymentLimit: 256,
		// 			aip11: true,
		// 		},
		// 		{
		// 			height: 23000,
		// 			reward: 66000,
		// 		},
		// 	],
		// 	{ spaces: 4 },
		// );
	});

	it("should generate a new configuration using force option", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				token: "myn",
				force: true,
			})
			.execute(Command);

		existsSync.calledWith(configCore);
		existsSync.calledWith(configCrypto);
		ensureDirSync.calledWith(configCore);
		ensureDirSync.calledWith(configCrypto);
		writeJSONSync.calledTimes(8); // 5x Core + 2x Crypto + App
		writeFileSync.calledTimes(2); // index.ts && .env
	});

	it("should overwrite if overwriteConfig is set", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				network: "testnet",
				premine: "120000000000",
				delegates: "47",
				blocktime: "9",
				maxTxPerBlock: "122",
				maxBlockPayload: "123444",
				rewardHeight: "23000",
				rewardAmount: "66000",
				pubKeyHash: "168",
				wif: "27",
				token: "myn",
				symbol: "my",
				explorer: "myex.io",
				distribute: "true",
				overwriteConfig: "true",
			})
			.execute(Command);

		existsSync.neverCalled();
		existsSync.neverCalled();
		ensureDirSync.calledWith(configCore);
		ensureDirSync.calledWith(configCrypto);
		writeJSONSync.calledTimes(8); // 5x Core + 2x Crypto + App
		writeFileSync.calledTimes(2); // index.ts && .env
	});

	it("should generate crypto on custom path", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				network: "testnet",
				premine: "120000000000",
				delegates: "47",
				blocktime: "9",
				maxTxPerBlock: "122",
				maxBlockPayload: "123444",
				rewardHeight: "23000",
				rewardAmount: "66000",
				pubKeyHash: "168",
				wif: "27",
				token: "myn",
				symbol: "my",
				explorer: "myex.io",
				distribute: "true",
				configPath: "/path/to/config",
			})
			.execute(Command);

		existsSync.calledWith("/path/to/config/testnet");
		existsSync.calledWith("/path/to/config/testnet/crypto");
		ensureDirSync.calledWith("/path/to/config/testnet");
		ensureDirSync.calledWith("/path/to/config/testnet/crypto");
		writeJSONSync.calledTimes(8); // 5x Core + 2x Crypto + App
		writeFileSync.calledTimes(2); // index.ts && .env
	});

	it("should allow empty peers", async ({ cli }) => {
		const existsSync = stub(fs, "existsSync");
		const ensureDirSync = stub(fs, "ensureDirSync");
		const writeJSONSync = stub(fs, "writeJSONSync");
		const writeFileSync = stub(fs, "writeFileSync");

		await cli
			.withFlags({
				network: "testnet",
				premine: "120000000000",
				delegates: "47",
				blocktime: "9",
				maxTxPerBlock: "122",
				maxBlockPayload: "123444",
				rewardHeight: "23000",
				rewardAmount: "66000",
				pubKeyHash: "168",
				wif: "27",
				token: "myn",
				symbol: "my",
				explorer: "myex.io",
				distribute: "true",
				peers: "",
			})
			.execute(Command);

		existsSync.calledWith(configCore);
		existsSync.calledWith(configCrypto);
		ensureDirSync.calledWith(configCore);
		ensureDirSync.calledWith(configCrypto);
		writeJSONSync.calledTimes(8); // 5x Core + 2x Crypto + App
		writeFileSync.calledTimes(2); // index.ts && .env
	});
});
