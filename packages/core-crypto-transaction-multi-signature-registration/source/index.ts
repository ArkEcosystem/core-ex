import { Container } from "@arkecosystem/core-container";
import { Identifiers } from "@arkecosystem/core-contracts";
import { TransactionRegistry } from "@arkecosystem/core-crypto-transaction";
import { Providers } from "@arkecosystem/core-kernel";

import { MultiSignatureRegistrationTransaction } from "./versions/1";

export * from "./builder";
export * from "./versions";

@Container.injectable()
export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		const registry: TransactionRegistry = this.app.get(Identifiers.Cryptography.Transaction.Registry);

		registry.registerTransactionType(MultiSignatureRegistrationTransaction);
	}
}
