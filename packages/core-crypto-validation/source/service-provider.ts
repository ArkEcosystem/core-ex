import { BINDINGS, IValidator } from "@arkecosystem/core-crypto-contracts";
import { Providers } from "@arkecosystem/core-kernel";
import { signedSchema, strictSchema } from "@packages/crypto/distribution/transactions/types/schemas";

import { schemas } from "./schemas";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		this.app.get<IValidator>(BINDINGS.Validator).extend((ajv) => {
			for (const schema of this.transactionSchemas.values()) {
				let remove = false;

				if (ajv.getSchema(schema.$id)) {
					remove = true;
				}

				if (remove) {
					this.transactionSchemas.delete(schema.$id);

					ajv.removeSchema(schema.$id);
					ajv.removeSchema(`${schema.$id}Signed`);
					ajv.removeSchema(`${schema.$id}Strict`);
				}

				this.transactionSchemas.set(schema.$id, schema);

				ajv.addSchema(schema);
				ajv.addSchema(signedSchema(schema));
				ajv.addSchema(strictSchema(schema));

				// Update schemas
				ajv.removeSchema("block");
				ajv.removeSchema("transactions");
				ajv.addSchema({
					$id: "transactions",
					additionalItems: false,
					items: { anyOf: [...this.transactionSchemas.keys()].map((schema) => ({ $ref: `${schema}Signed` })) },
					type: "array",
				});
				ajv.addSchema(schemas.block);
			}
		})
	}
}
