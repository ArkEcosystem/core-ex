import { describe } from "../../../core-test-framework";
import { buildApp } from "../app-builder";
import { GenesisBlockGenerator } from "./genesis-block-generator";
import { MnemonicGenerator } from "./mnemonic-generator";

describe<{
	generator: GenesisBlockGenerator;
}>("App generator", ({ it, assert, beforeEach }) => {
	beforeEach(async (context) => {
		context.generator = new GenesisBlockGenerator(await buildApp());
	});

	it("#generate - should return generated data", async ({ generator }) => {
		const validatorsCount = 10;
		assert.object(
			await generator.generate(MnemonicGenerator.generate(), MnemonicGenerator.generateMany(validatorsCount), {
				distribute: true,
				epoch: new Date(),
				premine: "2000000000",
				pubKeyHash: 123,
			}),
		);
	});
});
