import { describe } from "../../../core-test-framework";
import { MnemonicGenerator } from "./mnemonic-generator";

describe("Mnemonic generator", ({ it, assert }) => {
	it("#generate - should generate mnemonic", ({ generator }) => {
		assert.string(MnemonicGenerator.generate());
	});

	it("#generateMany - should generate many mnemonic", ({ generator }) => {
		const mnemonics = MnemonicGenerator.generateMany(3);

		assert.array(mnemonics);
		assert.equal(mnemonics.length, 3);
	});
});
