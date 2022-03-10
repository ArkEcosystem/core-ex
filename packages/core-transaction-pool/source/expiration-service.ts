import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";

@injectable()
export class ExpirationService implements Contracts.TransactionPool.ExpirationService {
	@inject(Identifiers.Application)
	public readonly app!: Contracts.Kernel.Application;

	@inject(Identifiers.StateStore)
	private readonly stateStore!: Contracts.State.StateStore;

	public canExpire(transaction: Contracts.Crypto.ITransaction): boolean {
		return !!transaction.data.expiration;
	}

	public async isExpired(transaction: Contracts.Crypto.ITransaction): Promise<boolean> {
		if (this.canExpire(transaction)) {
			return (await this.getExpirationHeight(transaction)) <= this.stateStore.getLastHeight() + 1;
		}

		return false;
	}

	public async getExpirationHeight(transaction: Contracts.Crypto.ITransaction): Promise<number> {
		return transaction.data.expiration;
	}
}
