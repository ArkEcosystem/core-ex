import { describe } from "../../core-test-framework/source";

import { Signature } from "./signature";

describe("Signature", ({ assert, it }) => {
	it("should sign", async () => {
		assert.equal(
			await new Signature().sign(
				Buffer.from("64726e3da8", "hex"),
				Buffer.from("814857ce48e291893feab95df02e1dbf7ad3994ba46f247f77e4eefd5d8734a2", "hex"),
			),
			"4ae81f14a2b8a1297c18b587a4502d70999343d932e8be827d3e41d545ab71f53ab2a6371838f8fb3ede8f573c140802dc400e1b99dbc086a91b4788aba98d44",
		);
	});

	it("should verify", async () => {
		assert.true(
			await new Signature().verify(
				Buffer.from(
					"4ae81f14a2b8a1297c18b587a4502d70999343d932e8be827d3e41d545ab71f53ab2a6371838f8fb3ede8f573c140802dc400e1b99dbc086a91b4788aba98d44",
					"hex",
				),
				Buffer.from("64726e3da8", "hex"),
				Buffer.from("e84093c072af70004a38dd95e34def119d2348d5261228175d032e5f2070e19f", "hex"),
			),
		);
	});
});
