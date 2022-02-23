import { describe } from "@arkecosystem/core-test-framework";

import { Signatory } from "./signatory";

describe("Signatory", ({ assert, it }) => {
	it("should sign and verify", async () => {
		assert.true(
			await new Signatory().verify(
				Buffer.from(
					await new Signatory().sign(
						Buffer.from("814857ce48e291893feab95df02e1dbf7ad3994ba46f247f77e4eefd5d8734a2", "hex"),
						Buffer.from("814857ce48e291893feab95df02e1dbf7ad3994ba46f247f77e4eefd5d8734a2", "hex"),
					),
					"hex",
				),
				Buffer.from("814857ce48e291893feab95df02e1dbf7ad3994ba46f247f77e4eefd5d8734a2", "hex"),
				Buffer.from("e84093c072af70004a38dd95e34def119d2348d5261228175d032e5f2070e19f", "hex"),
			),
		);
	});
});
