import { injectable } from "@arkecosystem/core-container";

import { Generator, Wallet } from "./generator";

@injectable()
export class WalletGenerator extends Generator {
	async generate(mnemonic?: string): Promise<Wallet> {
		return this.createWallet(mnemonic);
	}
}
