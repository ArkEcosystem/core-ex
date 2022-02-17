import { describe } from "@arkecosystem/core-test";

import { Signatory } from "./index";

describe("Signatory", ({ assert, it }) => {
	it("should sign", async () => {
		assert.is(await new Signatory().sign(
			Buffer.from("64726e3da8", "hex"),
			Buffer.from("67d53f170b908cabb9eb326c3c337762d59289a8fec79f7bc9254b584b73265c", "hex"),
		), "b22317bfdb10ba592724c27d0cdc51378e5cd94a12cd7e85c895d2a68e8589e8d3c5b3c80f4fe905ef67aa7827617d04110c5c5248f2bb36df97a58c541961ed0f2fcd0760e9de5ae1598f27638dd3ddaebeea08bf313832a57cfdb7f2baaa03");
	});

	it("should verify", async () => {
		assert.true(await new Signatory().verify(
			Buffer.from("64726e3da8", "hex"),
			Buffer.from("b22317bfdb10ba592724c27d0cdc51378e5cd94a12cd7e85c895d2a68e8589e8d3c5b3c80f4fe905ef67aa7827617d04110c5c5248f2bb36df97a58c541961ed0f2fcd0760e9de5ae1598f27638dd3ddaebeea08bf313832a57cfdb7f2baaa03", "hex"),
			Buffer.from("a7e75af9dd4d868a41ad2f5a5b021d653e31084261724fb40ae2f1b1c31c778d3b9464502d599cf6720723ec5c68b59d", "hex"),
		));
	});
});
