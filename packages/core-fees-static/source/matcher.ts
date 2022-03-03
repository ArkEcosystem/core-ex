import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Exceptions,Identifiers  } from "@arkecosystem/core-contracts";
import { FeeRegistry } from "@arkecosystem/core-fees";
import { BigNumber } from "@arkecosystem/utils";

@injectable()
export class FeeMatcher implements Contracts.TransactionPool.FeeMatcher {
	@inject(Identifiers.LogService)
	private readonly logger: Contracts.Kernel.Logger;

	@inject(Identifiers.Fee.Registry)
	private readonly feeRegistry: FeeRegistry;

	public async throwIfCannotEnterPool(transaction: Contracts.Crypto.ITransaction): Promise<void> {
		this.#throwIfCannot("pool", transaction);
	}

	public async throwIfCannotBroadcast(transaction: Contracts.Crypto.ITransaction): Promise<void> {
		this.#throwIfCannot("broadcast", transaction);
	}

	#throwIfCannot(action: string, transaction: Contracts.Crypto.ITransaction): void {
		const feeString = transaction.data.fee; // @TODO: formatSatoshi

		const staticFee = this.feeRegistry.get(transaction.key, transaction.data.version);
		const staticFeeString = BigNumber.make(staticFee); // @TODO: formatSatoshi

		if (transaction.data.fee.isEqualTo(staticFee)) {
			this.logger.debug(`${transaction} eligible for ${action} (fee ${feeString} = ${staticFeeString})`);

			return undefined;
		}

		if (transaction.data.fee.isLessThan(staticFee)) {
			this.logger.notice(`${transaction} not eligible for ${action} (fee ${feeString} < ${staticFeeString})`);

			throw new Exceptions.TransactionFeeToLowError(transaction);
		}

		this.logger.notice(`${transaction} not eligible for ${action} (fee ${feeString} > ${staticFeeString})`);

		throw new Exceptions.TransactionFeeToHighError(transaction);
	}
}
