import { Identifiers } from "@arkecosystem/core-contracts";

import { describe } from "../index";
import { Sandbox } from "./sandbox";

describe("Sandbox", ({ it, assert, spyFn }) => {
	it("should create app", () => {
		const sandbox = new Sandbox();

		assert.defined(sandbox.app);
	});

	// it("should boot", async () => {
	// 	const sandbox = new Sandbox();

	// 	const callback = spyFn();

	// 	await assert.resolves(() => sandbox.boot(() => callback.call()));
	// 	callback.calledOnce();
	// });

	// it("should boot with crypto options", async () => {
	//     const sandbox = new Sandbox();

	//     const callback = jest.fn();

	//     const coreOptions: CryptoOptions = {
	//         flags: {
	//             network: "dummynet",
	//             premine: "15300000000000000",
	//             delegates: 51,
	//             blocktime: 8,
	//             maxTxPerBlock: 150,
	//             maxBlockPayload: 2097152,
	//             rewardHeight: 75600,
	//             rewardAmount: 200000000,
	//             pubKeyHash: 23,
	//             wif: 186,
	//             token: "DARK",
	//             symbol: "DѦ",
	//             explorer: "http://dexplorer.ark.io",
	//             distribute: true,
	//         },
	//     };

	//     await expect(sandbox.withCryptoOptions(coreOptions).boot(callback)).toResolve();
	//     expect(callback).toHaveBeenCalled();
	// });

	// it("should dispose", async () => {
	//     const sandbox = new Sandbox();

	//     await expect(sandbox.boot()).toResolve();
	//     await expect(sandbox.dispose()).toResolve();
	// });

	// it("should dispose with callback", async () => {
	//     const sandbox = new Sandbox();

	//     const callback = jest.fn();

	//     await expect(sandbox.boot()).toResolve();
	//     await expect(sandbox.dispose(callback)).toResolve();
	//     expect(callback).toHaveBeenCalled();
	// });

	it("should restore", async () => {
		const sandbox = new Sandbox();

		sandbox.snapshot();

		const testBinding = "test";

		sandbox.app.bind("test").toConstantValue(testBinding);

		assert.equal(sandbox.app.get("test"), testBinding);

		sandbox.restore();

		assert.throws(() => {
			sandbox.app.get("test");
		});
	});

	it("should register service provider", async () => {
		const sandbox = new Sandbox();

		sandbox.app.bind(Identifiers.EventDispatcherService).toConstantValue({});

		const serviceProviderOptions = {
			klass: require("@arkecosystem/core-crypto-transaction").ServiceProvider,
			name: "@arkecosystem/core-crypto-transaction",
			path: "@arkecosystem/core-crypto-transaction",
		};

		assert.equal(await sandbox.registerServiceProvider(serviceProviderOptions), sandbox);
	});
});
