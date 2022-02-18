import { describe } from "@arkecosystem/core-test";

import { KeyPairFactory } from "./index";

const mnemonic =
	"program fragile industry scare sun visit race erase daughter empty anxiety cereal cycle hunt airport educate giggle picture sunset apart jewel similar pulp moment";

describe("KeyPairFactory", ({ assert, it }) => {
	it("should derive a key pair from an mnemonic", () => {
		assert.equal(new KeyPairFactory().fromMnemonic(mnemonic), {
			publicKey: "804e6f1cbf0ca6d0eb8ff172f4578b28c5ebf9351efcb1b6e285b09bb5689c2f0036c17333108bf1bfdb40ac669eab45",
			privateKey: "6e00b393608d9754fb00db1fe63c2569294dfc9f01a4d106ef230e3e15df0886",
			compressed: true,
		});
	});

	it("should derive a key pair from an mnemonic", () => {
		assert.equal(
			new KeyPairFactory().fromPrivateKey(Buffer.from("6e00b393608d9754fb00db1fe63c2569294dfc9f01a4d106ef230e3e15df0886", 'hex')),
			{
				publicKey: "804e6f1cbf0ca6d0eb8ff172f4578b28c5ebf9351efcb1b6e285b09bb5689c2f0036c17333108bf1bfdb40ac669eab45",
				privateKey: "6e00b393608d9754fb00db1fe63c2569294dfc9f01a4d106ef230e3e15df0886",
				compressed: true,
			},
		);
	});
});
