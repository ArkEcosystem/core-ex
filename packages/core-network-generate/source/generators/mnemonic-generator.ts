import { generateMnemonic } from "bip39";

const MnemonicGenerator = {
	generate(): string {
		return generateMnemonic(256);
	},
	generateMany(count: number): string[] {
		return Array.from({ length: count }, () => this.generate());
	},
};

export { MnemonicGenerator };
