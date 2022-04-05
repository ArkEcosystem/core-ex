import { dirSync, setGracefulCleanup } from "tmp";

import { describe } from "../../../core-test-framework/distribution";
import { NetworkGenerator } from "./network";

describe<{
	dataPath: string;
	generator: NetworkGenerator;
}>("App generator", ({ it, assert, beforeEach, beforeAll }) => {
	beforeAll(() => {
		setGracefulCleanup();
	});

	beforeEach((context) => {
		context.dataPath = dirSync().name;
		context.generator = new NetworkGenerator();
	});

	it("#get - should throw if not generated", ({ generator }) => {
		assert.throws(() => generator.get());
	});

	it("#generate - should generate network", ({ generator }) => {
		assert.equal(
			generator
				.generate("nethash", {
					explorer: "http://myn.com",
					network: "testnet",
					pubKeyHash: 123,
					symbol: "my",
					token: "myn",
					wif: 44,
				})
				.get(),
			{
				client: {
					explorer: "http://myn.com",
					symbol: "my",
					token: "myn",
				},
				messagePrefix: `testnet message:\n`,
				name: "testnet",
				nethash: "nethash",
				pubKeyHash: 123,
				slip44: 1,
				wif: 44,
			},
		);
	});
});
