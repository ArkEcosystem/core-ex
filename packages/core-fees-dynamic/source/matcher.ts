import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { TransactionFeeToHighError, TransactionFeeToLowError } from "./errors";

@Container.injectable()
export class FeeMatcher implements Contracts.TransactionPool.FeeMatcher {
	@Container.inject(Container.Identifiers.PluginConfiguration)
	@Container.tagged("plugin", "core-transaction-pool")
	private readonly configuration!: Providers.PluginConfiguration;

	@Container.inject(Container.Identifiers.TransactionHandlerRegistry)
	@Container.tagged("state", "blockchain")
	private readonly handlerRegistry!: Handlers.Registry;

	@Container.inject(Container.Identifiers.StateStore)
	private readonly stateStore!: Contracts.State.StateStore;

	@Container.inject(Container.Identifiers.LogService)
	private readonly logger!: Contracts.Kernel.Logger;

	public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
		const dynamicFeesConfiguration: Record<string, any> =
			this.configuration.getRequired<Record<string, any>>("dynamicFees");
		const feeString = Utils.formatSatoshi(transaction.data.fee);

		if (dynamicFeesConfiguration.enabled) {
			const addonBytes: number = dynamicFeesConfiguration.addonBytes[transaction.key];
			const height: number = this.stateStore.getLastHeight();
			const handler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);

			const minFeePool: Utils.BigNumber = handler.dynamicFee({
				addonBytes,
				height,
				satoshiPerByte: dynamicFeesConfiguration.minFeePool,
				transaction,
			});
			const minFeeString = Utils.formatSatoshi(minFeePool);

			if (transaction.data.fee.isGreaterThanEqual(minFeePool)) {
				this.logger.debug(`${transaction} eligible to enter pool (fee ${feeString} >= ${minFeeString})`);

				return;
			}

			this.logger.notice(`${transaction} not eligible to enter pool (fee ${feeString} < ${minFeeString})`);

			throw new TransactionFeeToLowError(transaction);
		} else {
			const staticFeeString = Utils.formatSatoshi(transaction.staticFee);

			if (transaction.data.fee.isEqualTo(transaction.staticFee)) {
				this.logger.debug(`${transaction} eligible to enter pool (fee ${feeString} = ${staticFeeString})`);

				return;
			}
			if (transaction.data.fee.isLessThan(transaction.staticFee)) {
				this.logger.notice(`${transaction} not eligible to enter pool (fee ${feeString} < ${staticFeeString})`);

				throw new TransactionFeeToLowError(transaction);
			}

			this.logger.notice(`${transaction} not eligible to enter pool (fee ${feeString} > ${staticFeeString})`);

			throw new TransactionFeeToHighError(transaction);
		}
	}

	public async throwIfCannotBroadcast(transaction: Interfaces.ITransaction): Promise<void> {
		const dynamicFeesConfiguration: Record<string, any> =
			this.configuration.getRequired<Record<string, any>>("dynamicFees");
		const feeString = Utils.formatSatoshi(transaction.data.fee);

		if (dynamicFeesConfiguration.enabled) {
			const addonBytes: number = dynamicFeesConfiguration.addonBytes[transaction.key];
			const height: number = this.stateStore.getLastHeight();
			const handler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);

			const minFeeBroadcast: Utils.BigNumber = handler.dynamicFee({
				addonBytes,
				height,
				satoshiPerByte: dynamicFeesConfiguration.minFeeBroadcast,
				transaction,
			});
			const minFeeString = Utils.formatSatoshi(minFeeBroadcast);

			if (transaction.data.fee.isGreaterThanEqual(minFeeBroadcast)) {
				this.logger.debug(`${transaction} eligible for broadcast (fee ${feeString} >= ${minFeeString})`);
				return;
			}

			this.logger.notice(`${transaction} not eligible for broadcast (fee ${feeString} < ${minFeeString})`);
			throw new TransactionFeeToLowError(transaction);
		} else {
			const staticFeeString = Utils.formatSatoshi(transaction.staticFee);

			if (transaction.data.fee.isEqualTo(transaction.staticFee)) {
				this.logger.debug(`${transaction} eligible for broadcast (fee ${feeString} = ${staticFeeString})`);
				return;
			}
			if (transaction.data.fee.isLessThan(transaction.staticFee)) {
				this.logger.notice(`${transaction} not eligible to enter pool (fee ${feeString} < ${staticFeeString})`);
				throw new TransactionFeeToLowError(transaction);
			}

			this.logger.notice(`${transaction} not eligible to enter pool (fee ${feeString} > ${staticFeeString})`);
			throw new TransactionFeeToHighError(transaction);
		}
	}
}
