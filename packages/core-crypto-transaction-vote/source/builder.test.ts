import { Identifiers } from "@arkecosystem/core-contracts";
import { describe, Sandbox } from "@arkecosystem/core-test-framework";
import { BigNumber } from "@arkecosystem/utils";

import { VoteBuilder } from "./builder";
import { VoteTransaction } from "./versions/1";

describe<{
	sandbox: Sandbox;
	builder: VoteBuilder;
}>("VoteBuilder", ({ it, beforeEach, assert }) => {
	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Cryptography.Identity.AddressFactory).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Transaction.Factory).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Identity.KeyPairFactory).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Transaction.Signer).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Transaction.Utils).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Transaction.Verifier).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Time.Slots).toConstantValue({});

		context.builder = context.sandbox.app.resolve(VoteBuilder);
	});

	it("should initialize data", ({ builder }) => {
		const data = {
			type: VoteTransaction.type,
			typeGroup: VoteTransaction.typeGroup,
			amount: BigNumber.ZERO,
			recipientId: undefined,
			senderPublicKey: undefined,
			asset: { votes: [] },
		};

		for (const [key, value] of Object.entries(data)) {
			assert.equal(builder.data[key], value);
		}
	});

	it("#voteAsset - should set voteAsset", ({ builder }) => {
		const votes = ["+" + "aa".repeat(33)];

		builder.votesAsset(votes);

		assert.equal(builder.data.asset, { votes: votes });
	});

	// it("shoudl sign tranaction", async ({ builder }) => {
	// 	await builder.sign("passphrase");
	// });

	// it("#getStruct - should return struct", ({ builder }) => {
	// 	console.log(builder.getStruct());
	// });
});
