import { Slots } from "../../core-crypto-time/source/slots";
import { BlockTimeCalculator } from "../../core-crypto-time/source/block-time-calculator";
import { BlockTimeLookup } from "../../core-crypto-time/source/block-time-lookup";
import { Signer } from "./../../core-crypto-transaction/source/signer";
import fs from "fs-extra";
import { describe } from "../../core-test-framework";
import { Storage } from "./";
import { Stub } from "../../core-test-framework/source/uvu/stub";
import { Container } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { TransferBuilder } from "@arkecosystem/core-crypto-transaction-transfer";
import { PublicKeyFactory } from "../../core-crypto-key-pair-schnorr/source/public";
import { PublicKeySerializer } from "./../../core-crypto-key-pair-schnorr/source/serializer";
import { HashFactory } from "../../core-crypto-hash-bcrypto/source/hash.factory";
import { Signature } from "../../core-crypto-signature-schnorr/source/signature";
import { KeyPairFactory } from "../../core-crypto-key-pair-schnorr/source/pair";
import { AddressFactory } from "../../core-crypto-address-base58/source/address.factory";
import { Configuration } from "@arkecosystem/core-crypto-config";
import {
	Serializer,
	Deserializer,
	Utils,
	Verifier,
	TransactionFactory,
	TransactionTypeFactory,
} from "@arkecosystem/core-crypto-transaction/source";
import { Application } from "@arkecosystem/core-kernel";
import { Validator } from "../../core-validation/source/validator";

const buildTransaction = async (
	builder: TransferBuilder,
	nonce: string,
	recipient: string,
): Promise<Contracts.Crypto.ITransaction> => {
	const pendingTx = await builder
		.version(2)
		.amount("100")
		.recipientId(recipient)
		.nonce(nonce)
		.fee("900")
		.sign("sender's secret");

	return pendingTx.build();
};

describe<{
	configuration: any;
	app: Application;
	transaction1: Contracts.Crypto.ITransaction;
	transaction2: Contracts.Crypto.ITransaction;
	ensureFileSync: Stub;
	config: Configuration;
}>("Storage", ({ it, beforeAll, afterAll, assert, stub }) => {
	beforeAll(async (context) => {
		context.configuration = { getRequired: () => undefined };

		context.app = new Application(new Container());
		context.app.bind(Identifiers.PluginConfiguration).toConstantValue(context.configuration);
		context.app.bind(Identifiers.Cryptography.Identity.AddressFactory).to(AddressFactory);
		context.app.bind(Identifiers.Cryptography.Identity.PublicKeyFactory).to(PublicKeyFactory);
		context.app.bind(Identifiers.Cryptography.Identity.KeyPairFactory).to(KeyPairFactory);
		context.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();
		context.app.bind(Identifiers.Cryptography.Transaction.Factory).to(TransactionFactory);
		context.app.bind(Identifiers.Cryptography.Transaction.Verifier).to(Verifier);
		context.app.bind(Identifiers.Cryptography.Transaction.Utils).to(Utils);
		context.app.bind(Identifiers.Cryptography.Transaction.Serializer).to(Serializer);
		context.app.bind(Identifiers.Cryptography.Transaction.Deserializer).to(Deserializer);
		context.app.bind(Identifiers.Cryptography.Transaction.TypeFactory).to(TransactionTypeFactory);
		context.app.bind(Identifiers.Cryptography.Identity.PublicKeySerializer).to(PublicKeySerializer);
		context.app.bind(Identifiers.Cryptography.Signature).to(Signature);
		context.app.bind(Identifiers.Cryptography.HashFactory).to(HashFactory);
		context.app.bind(Identifiers.Cryptography.Validator).to(Validator);
		context.app.bind(Identifiers.Cryptography.Transaction.Signer).to(Signer);
		context.app.bind(Identifiers.Cryptography.Time.Slots).to(Slots).inSingletonScope();
		context.app.bind(Identifiers.Cryptography.Time.BlockTimeCalculator).to(BlockTimeCalculator).inSingletonScope();
		context.app.bind(Identifiers.Cryptography.Time.BlockTimeLookup).to(BlockTimeLookup).inSingletonScope();
		context.app.bind(Identifiers.Database.Service).toConstantValue({});

		context.config = context.app.get(Identifiers.Cryptography.Configuration);
		stub(context.config, "getMilestone").returnValue({ address: { base58: "ark" } });

		const recipient = await context.app
			.get<Contracts.Crypto.IAddressFactory>(Identifiers.Cryptography.Identity.AddressFactory)
			.fromMnemonic("recipient's secret");

		const builder = context.app.resolve<TransferBuilder>(TransferBuilder);

		context.transaction1 = await buildTransaction(builder, "1", recipient);
		context.transaction2 = await buildTransaction(builder, "2", recipient);

		context.ensureFileSync = stub(fs, "ensureFileSync").callsFake(() => {});
	});

	afterAll((context) => {
		// context.ensureFileSync.restore();
	});

	it("boot - should instantiate BetterSqlite3 using configured filename", (context) => {
		stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
		const storage = context.app.resolve(Storage);
		storage.boot();

		try {
			const database = storage["database"];
			context.ensureFileSync.calledWith(":memory:");
			assert.equal(database.name, ":memory:");
			assert.true(database.open);
		} finally {
			storage.dispose();
		}
	});

	// it("dispose - should close database", (context) => {
	// 	stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
	// 	const storage = context.app.resolve(Storage);
	// 	storage.boot();
	// 	const database = storage["database"];

	// 	storage.dispose();

	// 	assert.false(database.open);
	// });

	// it("hasTransaction - should find transaction that was added", (context) => {
	// 	stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
	// 	const storage = context.app.resolve(Storage);
	// 	storage.boot();

	// 	try {
	// 		storage.addTransaction({
	// 			height: 100,
	// 			id: context.transaction1.id,
	// 			senderPublicKey: context.transaction1.data.senderPublicKey,
	// 			serialized: context.transaction1.serialized,
	// 		});

	// 		const has = storage.hasTransaction(context.transaction1.id);
	// 		assert.true(has);
	// 	} finally {
	// 		storage.dispose();
	// 	}
	// });

	// it("hasTransaction - should not find transaction that wasn't added", (context) => {
	// 	stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
	// 	const storage = context.app.resolve(Storage);
	// 	storage.boot();

	// 	try {
	// 		storage.addTransaction({
	// 			height: 100,
	// 			id: context.transaction1.id,
	// 			senderPublicKey: context.transaction1.data.senderPublicKey,
	// 			serialized: context.transaction1.serialized,
	// 		});

	// 		const has = storage.hasTransaction(context.transaction2.id);
	// 		assert.false(has);
	// 	} finally {
	// 		storage.dispose();
	// 	}
	// });

	// it("getAllTransactions - should return all added transactions", (context) => {
	// 	stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
	// 	const storage = context.app.resolve(Storage);
	// 	storage.boot();

	// 	try {
	// 		const storedTransaction1 = {
	// 			height: 100,
	// 			id: context.transaction1.id,
	// 			senderPublicKey: context.transaction1.data.senderPublicKey,
	// 			serialized: context.transaction1.serialized,
	// 		};

	// 		const storedTransaction2 = {
	// 			height: 100,
	// 			id: context.transaction2.id,
	// 			senderPublicKey: context.transaction2.data.senderPublicKey,
	// 			serialized: context.transaction2.serialized,
	// 		};

	// 		storage.addTransaction(storedTransaction1);
	// 		storage.addTransaction(storedTransaction2);

	// 		const allTransactions = Array.from(storage.getAllTransactions());
	// 		assert.equal(allTransactions, [storedTransaction1, storedTransaction2]);
	// 	} finally {
	// 		storage.dispose();
	// 	}
	// });

	// it("getOldTransactions - should return only old transactions", (context) => {
	// 	stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
	// 	const storage = context.app.resolve(Storage);
	// 	storage.boot();

	// 	try {
	// 		const storedTransaction1 = {
	// 			height: 100,
	// 			id: context.transaction1.id,
	// 			senderPublicKey: context.transaction1.data.senderPublicKey,
	// 			serialized: context.transaction1.serialized,
	// 		};

	// 		const storedTransaction2 = {
	// 			height: 200,
	// 			id: context.transaction2.id,
	// 			senderPublicKey: context.transaction2.data.senderPublicKey,
	// 			serialized: context.transaction2.serialized,
	// 		};

	// 		storage.addTransaction(storedTransaction1);
	// 		storage.addTransaction(storedTransaction2);

	// 		const oldTransactions = Array.from(storage.getOldTransactions(100));
	// 		assert.equal(oldTransactions, [storedTransaction1]);
	// 	} finally {
	// 		storage.dispose();
	// 	}
	// });

	// it("getOldTransactions - should return all old transactions", (context) => {
	// 	stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
	// 	const storage = context.app.resolve(Storage);
	// 	storage.boot();

	// 	try {
	// 		const storedTransaction1 = {
	// 			height: 100,
	// 			id: context.transaction1.id,
	// 			senderPublicKey: context.transaction1.data.senderPublicKey,
	// 			serialized: context.transaction1.serialized,
	// 		};

	// 		const storedTransaction2 = {
	// 			height: 200,
	// 			id: context.transaction2.id,
	// 			senderPublicKey: context.transaction2.data.senderPublicKey,
	// 			serialized: context.transaction2.serialized,
	// 		};

	// 		storage.addTransaction(storedTransaction1);
	// 		storage.addTransaction(storedTransaction2);

	// 		const oldTransactions = Array.from(storage.getOldTransactions(200));
	// 		assert.equal(oldTransactions, [storedTransaction2, storedTransaction1]);
	// 	} finally {
	// 		storage.dispose();
	// 	}
	// });

	// it("addTransaction - should add new transaction", (context) => {
	// 	stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
	// 	const storage = context.app.resolve(Storage);
	// 	storage.boot();

	// 	try {
	// 		storage.addTransaction({
	// 			height: 100,
	// 			id: context.transaction1.id,
	// 			senderPublicKey: context.transaction1.data.senderPublicKey,
	// 			serialized: context.transaction1.serialized,
	// 		});

	// 		const has = storage.hasTransaction(context.transaction1.id);
	// 		assert.true(has);
	// 	} finally {
	// 		storage.dispose();
	// 	}
	// });

	// it("addTransaction - should throw when adding same transaction twice", (context) => {
	// 	stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
	// 	const storage = context.app.resolve(Storage);
	// 	storage.boot();

	// 	try {
	// 		storage.addTransaction({
	// 			height: 100,
	// 			id: context.transaction1.id,
	// 			senderPublicKey: context.transaction1.data.senderPublicKey,
	// 			serialized: context.transaction1.serialized,
	// 		});

	// 		assert.throws(() => {
	// 			storage.addTransaction({
	// 				height: 100,
	// 				id: context.transaction1.id,
	// 				senderPublicKey: context.transaction1.data.senderPublicKey,
	// 				serialized: context.transaction1.serialized,
	// 			});
	// 		});
	// 	} finally {
	// 		storage.dispose();
	// 	}
	// });

	// it("removeTransaction - should remove previously added transaction", (context) => {
	// 	stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
	// 	const storage = context.app.resolve(Storage);
	// 	storage.boot();

	// 	try {
	// 		storage.addTransaction({
	// 			height: 100,
	// 			id: context.transaction1.id,
	// 			senderPublicKey: context.transaction1.data.senderPublicKey,
	// 			serialized: context.transaction1.serialized,
	// 		});

	// 		storage.removeTransaction(context.transaction1.id);

	// 		const has = storage.hasTransaction(context.transaction1.id);
	// 		assert.false(has);
	// 	} finally {
	// 		storage.dispose();
	// 	}
	// });

	// it("flush - should remove all previously added transactions", (context) => {
	// 	stub(context.configuration, "getRequired").returnValueOnce(":memory:"); // storage
	// 	const storage = context.app.resolve(Storage);
	// 	storage.boot();

	// 	try {
	// 		storage.addTransaction({
	// 			height: 100,
	// 			id: context.transaction1.id,
	// 			senderPublicKey: context.transaction1.data.senderPublicKey,
	// 			serialized: context.transaction1.serialized,
	// 		});

	// 		storage.addTransaction({
	// 			height: 100,
	// 			id: context.transaction2.id,
	// 			senderPublicKey: context.transaction2.data.senderPublicKey,
	// 			serialized: context.transaction2.serialized,
	// 		});

	// 		storage.flush();

	// 		const allTransactions = Array.from(storage.getAllTransactions());
	// 		assert.equal(allTransactions, []);
	// 	} finally {
	// 		storage.dispose();
	// 	}
	// });
});
