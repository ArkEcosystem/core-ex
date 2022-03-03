import "jest-extended";

import { Generators } from "@packages/core-test-framework/source";
import { TransactionFactory } from "@packages/core-test-framework/source/utils/transaction-factory";
import { Identities } from "@packages/crypto";
import { Hash } from "@packages/crypto/source/crypto";
import { Keys } from "@packages/crypto/source/identities";
import { BuilderFactory, Utils as TransactionUtils, Verifier } from "@packages/crypto/source/transactions";

import { configManager } from "../../../../packages/crypto/source/managers";
import { createRandomTx } from "./__support__";

beforeEach(() => {
	// todo: completely wrap this into a function to hide the generation and setting of the config?
	configManager.setConfig(Generators.generateCryptoConfigRaw());
});

describe("Verifier", () => {
	describe("verify", () => {
		const transaction = TransactionFactory.initialize()
			.transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
			.withVersion(2)
			.withFee(2000)
			.withPassphrase("secret")
			.createOne();

		const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

		it("should return true on a valid signature", () => {
			expect(Verifier.verifyHash(transaction)).toBeTrue();
		});

		it("should return false on an invalid signature", () => {
			expect(
				Verifier.verifyHash(Object.assign({}, transaction, { senderPublicKey: otherPublicKey })),
			).toBeFalse();
		});

		it("should return false on a missing signature", () => {
			const transactionWithoutSignature = Object.assign({}, transaction);
			delete transactionWithoutSignature.signature;

			expect(Verifier.verifyHash(transactionWithoutSignature)).toBeFalse();
		});

		it("should verify ECDSA signature for a version 2 transaction", () => {
			const keys = Keys.fromPassphrase("secret");
			const { data }: any = BuilderFactory.transfer()
				.senderPublicKey(keys.publicKey)
				.recipientId(Identities.Address.fromPublicKey(keys.publicKey))
				.version(2)
				.fee("10")
				.amount("100");

			const hash = TransactionUtils.toHash(data);
			data.signature = Hash.signECDSA(hash, keys);

			expect(Verifier.verify(data)).toBeTrue();
		});

		// Test each type on it's own
		describe.each([0, 2, 3])("type %s", (type) => {
			it("should be ok", () => {
				const tx = createRandomTx(type);
				expect(tx.verify()).toBeTrue();
			});
		});

		describe("type 4", () => {
			it("should return false if AIP11 is not activated", () => {
				const tx = createRandomTx(4);
				configManager.getMilestone().aip11 = false;
				expect(tx.verify()).toBeFalse();
			});

			it("should return true if AIP11 is activated", () => {
				const tx = createRandomTx(4);
				configManager.getMilestone().aip11 = true;
				expect(tx.verify()).toBeTrue();
				configManager.getMilestone().aip11 = false;
			});
		});
	});
});