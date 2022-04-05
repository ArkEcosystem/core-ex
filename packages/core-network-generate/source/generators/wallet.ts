import { Generator, Wallet } from "./generator";

export class WalletGenerator extends Generator {
	async generate(mnemonic?: string): Promise<Wallet> {
		return this.createWallet(mnemonic);
	}
}
