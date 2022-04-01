import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { TransactionRegistry } from "@arkecosystem/core-crypto-transaction";
import { MultiPaymentTransaction } from "@arkecosystem/core-crypto-transaction-multi-payment";
import { MultiSignatureRegistrationTransaction } from "@arkecosystem/core-crypto-transaction-multi-signature-registration";
import { TransferTransaction } from "@arkecosystem/core-crypto-transaction-transfer";
import { ValidatorRegistrationTransaction } from "@arkecosystem/core-crypto-transaction-validator-registration";
import { ValidatorResignationTransaction } from "@arkecosystem/core-crypto-transaction-validator-resignation";
import { VoteTransaction } from "@arkecosystem/core-crypto-transaction-vote";
import { Types } from "@arkecosystem/core-kernel";

import { Sandbox } from "../../app/sandbox";

type ServiceProvider = {
	name: string;
	path: string;
	klass: Types.Class<any, any[]>;
};

const addressBech32m: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-address-bech32m").ServiceProvider,
	name: "@arkecosystem/core-crypto-address-bech32m",
	path: "@arkecosystem/core-crypto-address-bech32m",
};

const keyPairSchnorr: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-key-pair-schnorr").ServiceProvider,
	name: "@arkecosystem/core-crypto-key-pair-schnorr",
	path: "@arkecosystem/core-crypto-key-pair-schnorr",
};

const signatureSchnorr: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-signature-schnorr").ServiceProvider,
	name: "@arkecosystem/core-crypto-signature-schnorr",
	path: "@arkecosystem/core-crypto-signature-schnorr",
};

const hashBcrypto: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-hash-bcrypto").ServiceProvider,
	name: "@arkecosystem/core-crypto-hash-bcrypto",
	path: "@arkecosystem/core-crypto-hash-bcrypto",
};

const cryptoValidation: ServiceProvider = {
	klass: require("@arkecosystem/core-validation").ServiceProvider,
	name: "@arkecosystem/core-validation",
	path: "@arkecosystem/core-validation",
};

const cryptoTransaction: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-transaction").ServiceProvider,
	name: "@arkecosystem/core-crypto-transaction",
	path: "@arkecosystem/core-crypto-transaction",
};

const cryptoBlock: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-block").ServiceProvider,
	name: "@arkecosystem/core-crypto-block",
	path: "@arkecosystem/core-crypto-block",
};

const cryptoSerializer: ServiceProvider = {
	klass: require("@arkecosystem/core-serializer").ServiceProvider,
	name: "@arkecosystem/core-serializer",
	path: "@arkecosystem/core-serializer",
};

const cryptoWif: ServiceProvider = {
	klass: require("@arkecosystem/core-crypto-wif").ServiceProvider,
	name: "@arkecosystem/core-crypto-wif",
	path: "@arkecosystem/core-crypto-wif",
};

export const generateApp = async (config: Contracts.Crypto.NetworkConfig): Promise<Contracts.Kernel.Application> => {
	const sandbox = new Sandbox();

	sandbox.app.bind(Identifiers.EventDispatcherService).toConstantValue({});

	sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
	sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(config);

	await sandbox.registerServiceProvider(addressBech32m);
	await sandbox.registerServiceProvider(keyPairSchnorr);
	await sandbox.registerServiceProvider(signatureSchnorr);
	await sandbox.registerServiceProvider(hashBcrypto);
	await sandbox.registerServiceProvider(cryptoValidation);
	await sandbox.registerServiceProvider(cryptoTransaction);
	await sandbox.registerServiceProvider(cryptoBlock);
	await sandbox.registerServiceProvider(cryptoSerializer);
	await sandbox.registerServiceProvider(cryptoWif);

	sandbox.app
		.get<TransactionRegistry>(Identifiers.Cryptography.Transaction.Registry)
		.registerTransactionType(TransferTransaction);
	sandbox.app
		.get<TransactionRegistry>(Identifiers.Cryptography.Transaction.Registry)
		.registerTransactionType(ValidatorRegistrationTransaction);
	sandbox.app
		.get<TransactionRegistry>(Identifiers.Cryptography.Transaction.Registry)
		.registerTransactionType(ValidatorResignationTransaction);
	sandbox.app
		.get<TransactionRegistry>(Identifiers.Cryptography.Transaction.Registry)
		.registerTransactionType(VoteTransaction);
	sandbox.app
		.get<TransactionRegistry>(Identifiers.Cryptography.Transaction.Registry)
		.registerTransactionType(MultiSignatureRegistrationTransaction);
	sandbox.app
		.get<TransactionRegistry>(Identifiers.Cryptography.Transaction.Registry)
		.registerTransactionType(MultiPaymentTransaction);

	return sandbox.app;
};
