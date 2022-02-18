import { describe } from "@arkecosystem/core-test-framework";

import { HashFactory } from "./index";

describe("HashFactory", ({ assert, it }) => {
	it("should create a hash with the RIPEMD160 method", async () => {
		assert.is(
			Buffer.from(await new HashFactory().ripemd160(Buffer.from("Hello World"))).toString("hex"),
			"a830d7beb04eb7549ce990fb7dc962e499a27230",
		);
	});

	it("should create a hash with the SHA256 method", async () => {
		assert.is(
			Buffer.from(await new HashFactory().sha256(Buffer.from("Hello World"))).toString("hex"),
			"a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
		);
	});

	it("should create a hash with the HASH160 method", async () => {
		assert.is(
			Buffer.from(await new HashFactory().hash160(Buffer.from("Hello World"))).toString("hex"),
			"bdfb69557966d026975bebe914692bf08490d8ca",
		);
	});

	it("should create a hash with the HASH256 method", async () => {
		assert.is(
			Buffer.from(await new HashFactory().hash256(Buffer.from("Hello World"))).toString("hex"),
			"42a873ac3abd02122d27e80486c6fa1ef78694e8505fcec9cbcc8a7728ba8949",
		);
	});
});
