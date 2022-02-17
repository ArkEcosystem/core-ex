import { describe } from "@arkecosystem/core-test";

import { Signatory } from "./index";

describe("Signatory", ({ assert, it }) => {
	it("should sign", async () => {
		const signatory = new Signatory();
		await signatory.init();

		assert.is(signatory.sign(
			Buffer.from("Hello World"),
			Buffer.from("07656fd676da43883d163f49566c72b9cbf0a5a294f26808c807700732456da7", "hex"),
		), "0xaf69452ca3e3e3fdaeb3d72ab3a025660040f4217f4047dbdd6c118e5efeed1ece0095cf12944334bd5dd48db055c954110f04814da1263f300f355488904b30c6ebf4cee903d4fb414e3a3a70b974816da224a54aa5502b48bc7b0210faace8");
	});

	it("should verify", async () => {
		const signatory = new Signatory();
		await signatory.init();

		assert.true(signatory.verify(
			Buffer.from("Hello World"),
			Buffer.from("0xaf69452ca3e3e3fdaeb3d72ab3a025660040f4217f4047dbdd6c118e5efeed1ece0095cf12944334bd5dd48db055c954110f04814da1263f300f355488904b30c6ebf4cee903d4fb414e3a3a70b974816da224a54aa5502b48bc7b0210faace8", "hex"),
			Buffer.from("07656fd676da43883d163f49566c72b9cbf0a5a294f26808c807700732456da7", "hex"),
		));
	});
});
