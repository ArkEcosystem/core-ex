import { Container } from "@arkecosystem/core-container";
import { Identifiers } from "@arkecosystem/core-contracts";
import { ServiceProvider as CoreCryptoAddressBech32m } from "@arkecosystem/core-crypto-address-bech32m";
import { ServiceProvider as CoreCryptoBlock } from "@arkecosystem/core-crypto-block";
import { ServiceProvider as CoreCryptoConfig } from "@arkecosystem/core-crypto-config";
import { ServiceProvider as CoreCryptoHashBcrypto } from "@arkecosystem/core-crypto-hash-bcrypto";
import { ServiceProvider as CoreCryptoKeyPairSchnorr } from "@arkecosystem/core-crypto-key-pair-schnorr";
import { ServiceProvider as CoreCryptoSignatureSchnorr } from "@arkecosystem/core-crypto-signature-schnorr";
import { ServiceProvider as CoreCryptoTime } from "@arkecosystem/core-crypto-time";
import { ServiceProvider as CoreCryptoTransaction } from "@arkecosystem/core-crypto-transaction";
import { ServiceProvider as CoreCryptoTransactionMultiPayment } from "@arkecosystem/core-crypto-transaction-multi-payment";
import { ServiceProvider as CoreCryptoTransactionMultiSignatureRegistration } from "@arkecosystem/core-crypto-transaction-multi-signature-registration";
import { ServiceProvider as CoreCryptoTransactionTransfer } from "@arkecosystem/core-crypto-transaction-transfer";
import { ServiceProvider as CoreCryptoTransactionValidatorRegistration } from "@arkecosystem/core-crypto-transaction-validator-registration";
import { ServiceProvider as CoreCryptoTransactionValidatorResignation } from "@arkecosystem/core-crypto-transaction-validator-resignation";
import { ServiceProvider as CoreCryptoTransactionVote } from "@arkecosystem/core-crypto-transaction-vote";
import { ServiceProvider as CoreCryptoValidation } from "@arkecosystem/core-crypto-validation";
import { ServiceProvider as CoreCryptoWif } from "@arkecosystem/core-crypto-wif";
import { ServiceProvider as CoreDatabase } from "@arkecosystem/core-database";
import { ServiceProvider as CoreFees } from "@arkecosystem/core-fees";
import { ServiceProvider as CoreFeesStatic } from "@arkecosystem/core-fees-static";
import { Application } from "@arkecosystem/core-kernel";
import { ServiceProvider as CoreLMDB } from "@arkecosystem/core-lmdb";
import { ServiceProvider as CoreSerializer } from "@arkecosystem/core-serializer";
import { ServiceProvider as CoreValidation } from "@arkecosystem/core-validation";

export class NetworkGenerator {
	#app: Application;

	public constructor() {
		this.#app = new Application(new Container());
	}

	public async initialize(): Promise<void> {
		this.#app.bind(Identifiers.LogService).toConstantValue({});

		await this.#app.resolve(CoreSerializer).register();
		await this.#app.resolve(CoreValidation).register();
		await this.#app.resolve(CoreCryptoConfig).register();
		await this.#app.resolve(CoreCryptoTime).register();
		await this.#app.resolve(CoreCryptoValidation).register();
		await this.#app.resolve(CoreCryptoHashBcrypto).register();
		await this.#app.resolve(CoreCryptoSignatureSchnorr).register();
		await this.#app.resolve(CoreCryptoKeyPairSchnorr).register();
		await this.#app.resolve(CoreCryptoAddressBech32m).register();
		await this.#app.resolve(CoreCryptoWif).register();
		await this.#app.resolve(CoreCryptoBlock).register();
		await this.#app.resolve(CoreLMDB).register();
		await this.#app.resolve(CoreDatabase).register();
		await this.#app.resolve(CoreFees).register();
		await this.#app.resolve(CoreFeesStatic).register();
		await this.#app.resolve(CoreCryptoTransaction).register();
		await this.#app.resolve(CoreCryptoTransactionValidatorRegistration).register();
		await this.#app.resolve(CoreCryptoTransactionValidatorResignation).register();
		await this.#app.resolve(CoreCryptoTransactionMultiPayment).register();
		await this.#app.resolve(CoreCryptoTransactionMultiSignatureRegistration).register();
		await this.#app.resolve(CoreCryptoTransactionTransfer).register();
		await this.#app.resolve(CoreCryptoTransactionVote).register();
	}
}
