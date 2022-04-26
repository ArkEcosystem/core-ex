import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { ServiceProvider as CryptoValidationServiceProvider } from "@arkecosystem/core-crypto-validation";
import { ServiceProvider as ValidationServiceProvider } from "@arkecosystem/core-validation";
import { BigNumber } from "@arkecosystem/utils";

import cryptoJson from "../../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../../../core-test-framework";
import { extend, transactionBaseSchema } from "./schemas";
// import { TransactionType } from "../enums";
// import { BuilderFactory, TransactionTypeFactory } from "../transactions";
// import { TransactionSchema } from "../transactions/types/schemas";
// import { validator as Ajv } from "../validation";
// // import { MultiSignatureBuilder } from "./builders/transactions/multi-signature";
// import { TransferBuilder } from "./builders/transactions/transfer";

const ARKTOSHI = 1e8;

// const signTransaction = (tx: MultiSignatureBuilder, values: string[]): void => {
// 	values.map((value, index) => tx.multiSign(value, index));
// };

describe<{
	sandbox: Sandbox;
	validator: Contracts.Crypto.IValidator;

	// address: string;
	// fee: number;
	// amount: string;
	// transaction: TransferBuilder;
	// transactionSchema: TransactionSchema;
}>("Schemas", ({ it, beforeAll, beforeEach, assert }) => {
	// beforeAll((context) => {
	// 	context.transactionSchema = TransactionTypeFactory.get(TransactionType.Transfer).getSchema();

	// 	context.address = "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh";
	// 	context.fee = 1 * ARKTOSHI;
	// 	context.amount = (10 * ARKTOSHI).toString();
	// });

	beforeEach(async (context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.sandbox.app.get<Configuration>(Identifiers.Cryptography.Configuration).setConfig(cryptoJson);

		await context.sandbox.app.resolve(ValidationServiceProvider).register();
		await context.sandbox.app.resolve(CryptoValidationServiceProvider).register();

		context.validator = context.sandbox.app.get<Contracts.Crypto.IValidator>(Identifiers.Cryptography.Validator);
	});

	const schema = extend(transactionBaseSchema, {
		$id: "transaction",
	});

	const transactionOriginal = {
		amount: 1,
		fee: 1,
		id: "1".repeat(64),
		network: 30,
		nonce: 0,
		senderPublicKey: "A".repeat(64),
		sighature: "A".repeat(64),
		type: 1,
		typeGroup: 0,
		version: 1,
	};

	it("transactionBaseSchema - should be valid", async ({ validator }) => {
		validator.addSchema(schema);

		assert.undefined((await validator.validate("transaction", transactionOriginal)).error);
	});

	it("transactionBaseSchema - ammount should be big number min 1", async ({ validator }) => {
		validator.addSchema(schema);

		const validValues = [1, "1", BigNumber.ONE, 100, "100", BigNumber.make(100)];

		for (const value of validValues) {
			const transaction = {
				...transactionOriginal,
				amount: value,
			};

			assert.undefined((await validator.validate("transaction", transaction)).error);
		}

		const invalidValues = [0, "0", 1.1, BigNumber.ZERO, -1, null, undefined, {}, "test"];

		for (const value of invalidValues) {
			const transaction = {
				...transactionOriginal,
				amount: value,
			};

			console.log((await validator.validate("transaction", transaction)).error);
			// assert.true((await validator.validate("transaction", transaction)).error);
		}
	});
});
