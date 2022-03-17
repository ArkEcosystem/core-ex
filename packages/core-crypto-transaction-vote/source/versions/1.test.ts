import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { describe, Sandbox } from "@arkecosystem/core-test-framework";
import { ByteBuffer } from "@arkecosystem/utils";

import { VoteTransaction } from "./index";

describe<{
	sanbox: Sandbox;
}>("VoteTransactionV1", ({ beforeEach, it, assert }) => {
	const PUBLIC_KEY_SIZE = 33;

	beforeEach((context) => {
		context.sanbox = new Sandbox();

		context.sanbox.app.bind(Identifiers.Cryptography.Identity.AddressFactory).toConstantValue({});
		context.sanbox.app.bind(Identifiers.Cryptography.Configuration).toConstantValue({});
		context.sanbox.app.bind(Identifiers.Cryptography.Size.PublicKey).toConstantValue(PUBLIC_KEY_SIZE);
	});

	it("shoudl serialize and deserialize transaction", async ({ sanbox }) => {
		const datas: Partial<Contracts.Crypto.ITransactionData>[] = [
			{
				asset: {
					votes: ["+" + "aa".repeat(PUBLIC_KEY_SIZE)],
				},
			},
			{
				asset: {
					votes: ["-" + "aa".repeat(PUBLIC_KEY_SIZE)],
				},
			},
			{
				asset: {
					votes: ["-" + "bb".repeat(PUBLIC_KEY_SIZE), "+" + "aa".repeat(PUBLIC_KEY_SIZE)],
				},
			},
		];

		for (const data of datas) {
			const transaction = sanbox.app.resolve(VoteTransaction);
			transaction.data = data as Contracts.Crypto.ITransactionData;

			const serialized = await transaction.serialize();

			assert.instance(serialized, ByteBuffer);

			transaction.data = {} as Contracts.Crypto.ITransactionData;
			serialized.reset();

			await transaction.deserialize(serialized);

			assert.equal(transaction.data, data);
		}
	});
});
