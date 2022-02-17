import { Application, Container, Contracts, Providers, Services } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/source/ioc";
import { NullEventDispatcher } from "@packages/core-kernel/source/services/events/drivers/null";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/source/stores/state";
import {
	addressesIndexer,
	publicKeysIndexer,
	usernamesIndexer,
} from "@packages/core-state/source/wallets/indexers/indexers";
import { Factories, Mocks } from "@packages/core-test-framework";
import passphrases from "@packages/core-test-framework/source/internal/passphrases.json";
import { getWalletAttributeSet } from "@packages/core-test-framework/source/internal/wallet-attributes";
import { Collator } from "@packages/core-transaction-pool/source";
import {
	ApplyTransactionAction,
	RevertTransactionAction,
	ThrowIfCannotEnterPoolAction,
	VerifyTransactionAction,
} from "@packages/core-transaction-pool/source/actions";
import { DynamicFeeMatcher } from "@packages/core-transaction-pool/source/dynamic-fee-matcher";
import { ExpirationService } from "@packages/core-transaction-pool/source/expiration-service";
import { Mempool } from "@packages/core-transaction-pool/source/mempool";
import { Query } from "@packages/core-transaction-pool/source/query";
import { SenderMempool } from "@packages/core-transaction-pool/source/sender-mempool";
import { SenderState } from "@packages/core-transaction-pool/source/sender-state";
import { One, Two } from "@packages/core-transactions/source/handlers";
import { TransactionHandlerProvider } from "@packages/core-transactions/source/handlers/handler-provider";
import { TransactionHandlerRegistry } from "@packages/core-transactions/source/handlers/handler-registry";
import { ServiceProvider } from "@packages/core-transactions/source/service-provider";
import { Identities, Utils } from "@packages/crypto";
import { IMultiSignatureAsset } from "@packages/crypto/source/interfaces";

const logger = {
	notice: jest.fn(),
	debug: jest.fn(),
	warning: jest.fn(),
};

export const initApp = (): Application => {
	const app: Application = new Application(new Container.Container());
	app.bind(Identifiers.ApplicationNamespace).toConstantValue("testnet");

	app.bind(Identifiers.LogService).toConstantValue(logger);

	app.bind<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes)
		.to(Services.Attributes.AttributeSet)
		.inSingletonScope();

	app.bind<Contracts.State.WalletIndexerIndex>(Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Contracts.State.WalletIndexes.Addresses,
		indexer: addressesIndexer,
		autoIndex: true,
	});

	app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Contracts.State.WalletIndexes.PublicKeys,
		indexer: publicKeysIndexer,
		autoIndex: true,
	});

	app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Contracts.State.WalletIndexes.Usernames,
		indexer: usernamesIndexer,
		autoIndex: true,
	});

	app.bind(Identifiers.WalletFactory).toFactory<Contracts.State.Wallet>(
		(context: Container.interfaces.Context) => (address: string) =>
			new Wallets.Wallet(
				address,
				new Services.Attributes.AttributeMap(
					context.container.get<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes),
				),
			),
	);

	app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

	app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set("maxTransactionAge", 500);
	app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
		"maxTransactionBytes",
		2000000,
	);
	app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
		"maxTransactionsPerSender",
		300,
	);

	app.bind(Container.Identifiers.StateStore).to(StateStore).inTransientScope();

	app.bind(Identifiers.TransactionPoolMempool).to(Mempool).inSingletonScope();

	app.bind(Identifiers.TransactionPoolQuery).to(Query).inSingletonScope();

	app.bind(Container.Identifiers.TransactionPoolCollator).to(Collator);
	app.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).to(DynamicFeeMatcher);
	app.bind(Container.Identifiers.TransactionPoolExpirationService).to(ExpirationService);

	app.bind(Container.Identifiers.TransactionPoolSenderMempool).to(SenderMempool);
	app.bind(Container.Identifiers.TransactionPoolSenderMempoolFactory).toAutoFactory(
		Container.Identifiers.TransactionPoolSenderMempool,
	);
	app.bind(Container.Identifiers.TransactionPoolSenderState).to(SenderState);

	app.bind(Identifiers.WalletRepository).to(Wallets.WalletRepository).inSingletonScope();

	app.bind(Identifiers.EventDispatcherService).to(NullEventDispatcher).inSingletonScope();

	app.bind(Identifiers.DatabaseBlockRepository).toConstantValue(Mocks.BlockRepository.instance);

	app.bind(Identifiers.DatabaseTransactionRepository).toConstantValue(Mocks.TransactionRepository.instance);

	app.bind(Identifiers.TransactionHandler).to(One.TransferTransactionHandler);
	app.bind(Identifiers.TransactionHandler).to(Two.TransferTransactionHandler);
	app.bind(Identifiers.TransactionHandler).to(One.DelegateRegistrationTransactionHandler);
	app.bind(Identifiers.TransactionHandler).to(Two.DelegateRegistrationTransactionHandler);
	app.bind(Identifiers.TransactionHandler).to(One.VoteTransactionHandler);
	app.bind(Identifiers.TransactionHandler).to(Two.VoteTransactionHandler);
	app.bind(Identifiers.TransactionHandler).to(One.MultiSignatureRegistrationTransactionHandler);
	app.bind(Identifiers.TransactionHandler).to(Two.MultiSignatureRegistrationTransactionHandler);
	app.bind(Identifiers.TransactionHandler).to(Two.MultiPaymentTransactionHandler);
	app.bind(Identifiers.TransactionHandler).to(Two.DelegateResignationTransactionHandler);

	app.bind(Identifiers.TransactionHandlerProvider).to(TransactionHandlerProvider).inSingletonScope();
	app.bind(Identifiers.TransactionHandlerRegistry).to(TransactionHandlerRegistry).inSingletonScope();
	app.bind(Identifiers.TransactionHandlerConstructors).toDynamicValue(
		ServiceProvider.getTransactionHandlerConstructorsBinding(),
	);

	app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();

	app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService).bind(
		"verifyTransaction",
		new VerifyTransactionAction(),
	);

	app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService).bind(
		"throwIfCannotEnterPool",
		new ThrowIfCannotEnterPoolAction(),
	);

	app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService).bind(
		"applyTransaction",
		new ApplyTransactionAction(),
	);

	app.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService).bind(
		"revertTransaction",
		new RevertTransactionAction(),
	);

	return app;
};

export const buildSenderWallet = (
	factoryBuilder: Factories.FactoryBuilder,
	passphrase: string = passphrases[0],
): Wallets.Wallet => {
	const wallet: Wallets.Wallet = factoryBuilder
		.get("Wallet")
		.withOptions({
			passphrase: passphrases[0],
			nonce: 0,
		})
		.make();

	wallet.setBalance(Utils.BigNumber.make(7527654310));

	return wallet;
};

export const buildRecipientWallet = (factoryBuilder: Factories.FactoryBuilder): Wallets.Wallet => {
	return factoryBuilder
		.get("Wallet")
		.withOptions({
			passphrase: "passphrase2",
		})
		.make();
};

export const buildMultiSignatureWallet = (): Wallets.Wallet => {
	const multiSignatureAsset: IMultiSignatureAsset = {
		publicKeys: [
			Identities.PublicKey.fromPassphrase(passphrases[0]),
			Identities.PublicKey.fromPassphrase(passphrases[1]),
			Identities.PublicKey.fromPassphrase(passphrases[2]),
		],
		min: 2,
	};

	const wallet = new Wallets.Wallet(
		Identities.Address.fromMultiSignatureAsset(multiSignatureAsset),
		new Services.Attributes.AttributeMap(getWalletAttributeSet()),
	);
	wallet.setPublicKey(Identities.PublicKey.fromMultiSignatureAsset(multiSignatureAsset));
	wallet.setBalance(Utils.BigNumber.make(100390000000));
	wallet.setAttribute("multiSignature", multiSignatureAsset);

	return wallet;
};
