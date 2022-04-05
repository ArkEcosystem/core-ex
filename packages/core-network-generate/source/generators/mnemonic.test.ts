import { describe } from "../../../core-test-framework/distribution";
import { MnemonicGenerator } from "./mnemonic";

describe("Mnemonic generator", ({ it, assert }) => {
	it("#generate - should generate mnemonic", () => {
		assert.string(MnemonicGenerator.generate());
	});

	it("#generateMany - should generate many mnemonic", () => {
		const mnemonics = MnemonicGenerator.generateMany(3);

		assert.array(mnemonics);
		assert.equal(mnemonics.length, 3);
	});
});
