import { BigNumber } from "../utils/bignum";
import { describe, Generators } from "@arkecosystem/core-test-framework";
import { TransactionFactory as TestTransactionFactory } from "@arkecosystem/core-test-framework/source/utils/transaction-factory";
import { InvalidTransactionBytesError, TransactionTypeError, TransactionVersionError } from "../errors";
import { Keys } from "../identities";
import { ITransaction, ITransactionData, NetworkConfig } from "../interfaces";
import { configManager } from "../managers";
import { BuilderFactory, Transaction, TransactionFactory, Utils as TransactionUtils } from "./";
import { transaction as transactionDataFixture } from "../../test/fixtures/transaction";

const createRandomTx = (type) => {
	let transaction: ITransaction;

	switch (type) {
		case 0: {
			// transfer
			transaction = BuilderFactory.transfer()
				.recipientId("DJLxkgm7JMortrGVh1ZrvDH39XALWLa83e")
				.amount("10000000000000")
				.vendorField(Math.random().toString(36))
				.sign(Math.random().toString(36))
				.build();
			break;
		}

		case 2: {
			// delegate registration
			transaction = BuilderFactory.delegateRegistration()
				.usernameAsset("dummydelegate")
				.sign(Math.random().toString(36))
				.build();
			break;
		}

		case 3: {
			// vote registration
			transaction = BuilderFactory.vote()
				.votesAsset(["+036928c98ee53a1f52ed01dd87db10ffe1980eb47cd7c0a7d688321f47b5d7d760"])
				.sign(Math.random().toString(36))
				.build();
			break;
		}

		case 4: {
			configManager.getMilestone().aip11 = true;
			const passphrases = [Math.random().toString(36), Math.random().toString(36), Math.random().toString(36)];

			const participants = passphrases.map((passphrase) => {
				return Keys.fromPassphrase(passphrase);
			});

			const min = Math.min(1, participants.length);
			const max = Math.max(1, participants.length);

			const multiSigRegistration = BuilderFactory.multiSignature().min(
				Math.floor(Math.random() * (max - min)) + min,
			);

			participants.forEach((participant) => {
				multiSigRegistration.participant(participant.publicKey);
			});

			multiSigRegistration.senderPublicKey(participants[0].publicKey);

			passphrases.forEach((passphrase, index) => {
				multiSigRegistration.multiSign(passphrase, index);
			});

			transaction = multiSigRegistration.sign(passphrases[0]).build();

			configManager.getMilestone().aip11 = false;
			break;
		}
		default: {
			throw new TransactionTypeError(type);
		}
	}

	return transaction;
};

const transactionData = { ...transactionDataFixture };
const transactionDataJSON = {
	...transactionData,
	...{ amount: transactionData.amount.toFixed(), fee: transactionData.fee.toFixed() },
};

describe<{
	config: NetworkConfig;
}>("Transaction", ({ it, assert, beforeAll, afterAll }) => {
	beforeAll((context) => {
		context.config = configManager.all();

		configManager.setFromPreset("devnet");
	});

	afterAll((context) => {
		configManager.setConfig(context.config);
	});

	it("toBytes / fromBytes - should verify all transactions", () => {
		[0, 2, 3]
			.map((type) => createRandomTx(type))
			.forEach((transaction) => {
				const newTransaction = TransactionFactory.fromBytes(TransactionUtils.toBytes(transaction.data));

				if (transaction.data.recipientId === undefined) {
					delete transaction.data.recipientId;
				}

				if (transaction.data.version === 1) {
					delete transaction.data.typeGroup;
					delete transaction.data.nonce;
				}

                if (transaction.data.version === 2) {
					delete transaction.data.typeGroup;
				}

                if (transaction.data.nonce) {
                    // @ts-ignore
                    transaction.data.nonce = BigNumber.make(transaction.data.nonce).toFixed();
                }

                if (transaction.data.amount) {
                    // @ts-ignore
                    transaction.data.amount = BigNumber.make(transaction.data.amount).toFixed();
                }

                if (transaction.data.fee) {
                    // @ts-ignore
                    transaction.data.fee = BigNumber.make(transaction.data.fee).toFixed();
                }

				assert.equal(newTransaction.toJson(), transaction.data);
				assert.true(newTransaction.verified);
			});
	});

	it("toBytes / fromBytes - should create a transaction", (context) => {
		const hex = TransactionUtils.toBytes(transactionData).toString("hex");
		const transaction = TransactionFactory.fromHex(hex);
		assert.instance(transaction, Transaction);
		assert.equal(transaction.toJson(), transactionDataJSON);
	});

	it("toBytes / fromBytes - should throw when getting garbage", () => {
		assert.throws(
			() => TransactionFactory.fromBytes(undefined),
			(err) => err instanceof TypeError,
		);
		assert.throws(
			() => TransactionFactory.fromBytes(Buffer.from("garbage")),
			(err) => err instanceof InvalidTransactionBytesError,
		);
		assert.throws(
			() => TransactionFactory.fromHex(undefined),
			(err) => err instanceof InvalidTransactionBytesError,
		);
		assert.throws(
			() => TransactionFactory.fromHex("affe"),
			(err) => err instanceof InvalidTransactionBytesError,
		);
	});

	it("toBytes / fromBytes - should throw when getting an unsupported version", () => {
		// todo: completely wrap this into a function to hide the generation and setting of the config?
		configManager.setConfig(Generators.generateCryptoConfigRaw());

		const transaction = BuilderFactory.transfer()
			.recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
			.amount("1000")
			.vendorField(Math.random().toString(36))
			.nonce("1")
			.sign(Math.random().toString(36))
			.build();

		let hex = transaction.serialized.toString("hex");
		hex = hex.slice(0, 2) + "04" + hex.slice(4);
		assert.throws(
			() => TransactionFactory.fromHex(hex),
			(err) => err instanceof TransactionVersionError,
		);
	});

	it("getHash - should return Buffer and Buffer must be 32 bytes length", () => {
		// todo: completely wrap this into a function to hide the generation and setting of the config?
		configManager.setConfig(Generators.generateCryptoConfigRaw());

		const transaction = TestTransactionFactory.initialize()
			.transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
			.withFee(2000)
			.withPassphrase("secret")
			.withVersion(2)
			.createOne();

		const result = TransactionUtils.toHash(transaction);
		assert.object(result);
		assert.equal(result.length, 32);
		assert.equal(result.toString("hex"), "27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c");
	});

	it("getHash - should throw for unsupported versions", () => {
		// todo: completely wrap this into a function to hide the generation and setting of the config?
		configManager.setConfig(Generators.generateCryptoConfigRaw());

		const transaction = TestTransactionFactory.initialize()
			.transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
			.withFee(2000)
			.withPassphrase("secret")
			.withVersion(2)
			.createOne();

		assert.throws(
			() => TransactionUtils.toHash(Object.assign({}, transaction, { version: 110 })),
			(err) => err instanceof TransactionVersionError,
		);
	});

	it("getId - should return string id and be equal to 27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c", () => {
		// todo: completely wrap this into a function to hide the generation and setting of the config?
		configManager.setConfig(Generators.generateCryptoConfigRaw());

		const transaction = TestTransactionFactory.initialize()
			.transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
			.withFee(2000)
			.withPassphrase("secret")
			.withVersion(2)
			.createOne();

		const id = TransactionUtils.getId(transaction); // old id
		assert.string(id);
		assert.equal(id, "27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c");
	});

	it("getId - should throw for unsupported version", () => {
		// todo: completely wrap this into a function to hide the generation and setting of the config?
		configManager.setConfig(Generators.generateCryptoConfigRaw());

		const transaction = TestTransactionFactory.initialize()
			.transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
			.withFee(2000)
			.withPassphrase("secret")
			.withVersion(2)
			.createOne();

		assert.throws(
			() => TransactionUtils.getId(Object.assign({}, transaction, { version: 110 })),
			(err) => err instanceof TransactionVersionError,
		);
	});
});
