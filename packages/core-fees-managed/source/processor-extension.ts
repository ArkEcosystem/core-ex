import { inject, injectable } from "@arkecosystem/core-container";
import { Crypto, Identifiers, TransactionPool } from "@arkecosystem/core-contracts";

@injectable()
export class ProcessorExtension extends TransactionPool.ProcessorExtension {
	@inject(Identifiers.Fee.Matcher)
	private readonly feeMatcher!: TransactionPool.FeeMatcher;

	public async throwIfCannotBroadcast(transaction: Crypto.ITransaction): Promise<void> {
		await this.feeMatcher.throwIfCannotBroadcast(transaction);
	}
}
