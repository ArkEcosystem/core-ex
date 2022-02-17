import { describe } from "@arkecosystem/core-test";

import { Signatory } from "./index";

describe("Signatory", ({ assert, it }) => {
	it("should sign", async () => {
		assert.is(await new Signatory().sign(
			Buffer.from("Hello World"),
			Buffer.from("07656fd676da43883d163f49566c72b9cbf0a5a294f26808c807700732456da7", "hex"),
		), "8b4156bf6d47b6d0a73805a0c264071d4d46ad406dabdfef6e9e43cb05f30aadd09d8a498d162470e40d57d89db8406f189d80a2a481b6d2fc270469bf7540faffdc00a6b8e1623559e6fda55570edbe5beb2774c76a4eed8950986625d65726");
	});

	it("should verify", async () => {
		assert.true(await new Signatory().verify(
			Buffer.from("Hello World"),
			Buffer.from("8b4156bf6d47b6d0a73805a0c264071d4d46ad406dabdfef6e9e43cb05f30aadd09d8a498d162470e40d57d89db8406f189d80a2a481b6d2fc270469bf7540faffdc00a6b8e1623559e6fda55570edbe5beb2774c76a4eed8950986625d65726", "hex"),
			Buffer.from("07656fd676da43883d163f49566c72b9cbf0a5a294f26808c807700732456da7", "hex"),
		));
	});
});
