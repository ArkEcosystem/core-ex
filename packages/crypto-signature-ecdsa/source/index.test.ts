import { describe } from "@arkecosystem/core-test";

import { Signatory } from "./index";

describe("Signatory", ({ assert, it }) => {
	it("should sign", async () => {
		assert.is(await new Signatory().sign(
			Buffer.from("64726e3da8", "hex"),
			Buffer.from("814857ce48e291893feab95df02e1dbf7ad3994ba46f247f77e4eefd5d8734a2", "hex"),
		), "3044022066f1c6d9fe13834f6e348aae40426060339ed8cba7d9b2f105c8220be095877c02201368fffd8294f1e22086703d33511fc8bb25231d6e9dc64d6449035003184bdd");
	});

	it("should verify", async () => {
		assert.true(await new Signatory().verify(
			Buffer.from("64726e3da8", "hex"),
			Buffer.from("3044022066f1c6d9fe13834f6e348aae40426060339ed8cba7d9b2f105c8220be095877c02201368fffd8294f1e22086703d33511fc8bb25231d6e9dc64d6449035003184bdd", "hex"),
			Buffer.from("03e84093c072af70004a38dd95e34def119d2348d5261228175d032e5f2070e19f", "hex"),
		));
	});
});
