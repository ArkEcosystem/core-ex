import { Application, Container, Contracts, Providers, Services } from "@packages/core-kernel";
import { Stores, Wallets } from "@packages/core-state";
import { Factories, getWalletAttributeSet, Mocks } from "@packages/core-test-framework";
import passphrases from "@packages/core-test-framework/source/internal/passphrases.json";
import {
	Collator,
	ApplyTransactionAction,
	DynamicFeeMatcher,
	ExpirationService,
	Mempool,
	Query,
	RevertTransactionAction,
	SenderMempool,
	SenderState,
	ThrowIfCannotEnterPoolAction,
	VerifyTransactionAction,
} from "@packages/core-transaction-pool";
import * as One from "../one";
import * as Two from "../two";
import { TransactionHandlerProvider } from "../../handlers/handler-provider";
import { TransactionHandlerRegistry } from "../../handlers/handler-registry";
import { ServiceProvider } from "../../service-provider";
import { Identities, Interfaces, Utils } from "@packages/crypto";

const logger = {
	notice: jest.fn(),
	debug: jest.fn(),
	warning: jest.fn(),
};

export const initApp = (): Application => {
	const app: Application = new Application(new Container.Container());
	app.bind(Container.Identifiers.ApplicationNamespace).toConstantValue("testnet");

	app.bind(Container.Identifiers.LogService).toConstantValue(logger);

	app.bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
		.to(Services.Attributes.AttributeSet)
		.inSingletonScope();

	app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Contracts.State.WalletIndexes.Addresses,
		indexer: Wallets.addressesIndexer,
		autoIndex: true,
	});

	app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Contracts.State.WalletIndexes.PublicKeys,
		indexer: Wallets.publicKeysIndexer,
		autoIndex: true,
	});

	app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Contracts.State.WalletIndexes.Usernames,
		indexer: Wallets.usernamesIndexer,
		autoIndex: true,
	});

	app.bind(Container.Identifiers.WalletFactory).toFactory<Contracts.State.Wallet>(
		(context: Container.interfaces.Context) => (address: string) =>
			new Wallets.Wallet(
				address,
				new Services.Attributes.AttributeMap(
					context.container.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes),
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

	app.bind(Container.Identifiers.StateStore).to(Stores.StateStore).inTransientScope();

	app.bind(Container.Identifiers.TransactionPoolMempool).to(Mempool).inSingletonScope();

	app.bind(Container.Identifiers.TransactionPoolQuery).to(Query).inSingletonScope();

	app.bind(Container.Identifiers.TransactionPoolCollator).to(Collator);
	app.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).to(DynamicFeeMatcher);
	app.bind(Container.Identifiers.TransactionPoolExpirationService).to(ExpirationService);

	app.bind(Container.Identifiers.TransactionPoolSenderMempool).to(SenderMempool);
	app.bind(Container.Identifiers.TransactionPoolSenderMempoolFactory).toAutoFactory(
		Container.Identifiers.TransactionPoolSenderMempool,
	);
	app.bind(Container.Identifiers.TransactionPoolSenderState).to(SenderState);

	app.bind(Container.Identifiers.WalletRepository).to(Wallets.WalletRepository).inSingletonScope();

	app.bind(Container.Identifiers.EventDispatcherService).to(Services.Events.NullEventDispatcher).inSingletonScope();

	app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(Mocks.BlockRepository.instance);

	app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(Mocks.TransactionRepository.instance);

	app.bind(Container.Identifiers.TransactionHandler).to(One.TransferTransactionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(Two.TransferTransactionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(One.DelegateRegistrationTransactionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(Two.DelegateRegistrationTransactionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(One.VoteTransactionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(Two.VoteTransactionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(One.MultiSignatureRegistrationTransactionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(Two.MultiSignatureRegistrationTransactionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(Two.MultiPaymentTransactionHandler);
	app.bind(Container.Identifiers.TransactionHandler).to(Two.DelegateResignationTransactionHandler);

	app.bind(Container.Identifiers.TransactionHandlerProvider).to(TransactionHandlerProvider).inSingletonScope();
	app.bind(Container.Identifiers.TransactionHandlerRegistry).to(TransactionHandlerRegistry).inSingletonScope();
	app.bind(Container.Identifiers.TransactionHandlerConstructors).toDynamicValue(
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
	const multiSignatureAsset: Interfaces.IMultiSignatureAsset = {
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
