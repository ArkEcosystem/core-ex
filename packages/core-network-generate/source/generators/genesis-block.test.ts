import { describe } from "../../../core-test-framework/distribution";
import { makeApplication } from "../application-factory";
import { GenesisBlockGenerator } from "./genesis-block";
import { MnemonicGenerator } from "./mnemonic";

describe<{
	generator: GenesisBlockGenerator;
	mnemonicGenerator: MnemonicGenerator;
}>("GenesisBlockGenerator", ({ it, assert, beforeEach }) => {
	beforeEach(async (context) => {
		context.generator = new GenesisBlockGenerator(await makeApplication());
		context.mnemonicGenerator = new MnemonicGenerator();
	});

	it("#generate - should return generated data", async ({ generator, mnemonicGenerator }) => {
		const validatorsCount = 10;
		assert.object(
			await generator.generate(mnemonicGenerator.generate(), mnemonicGenerator.generateMany(validatorsCount), {
				distribute: true,
				epoch: new Date(),
				premine: "2000000000",
				pubKeyHash: 123,
			}),
		);
	});
});
