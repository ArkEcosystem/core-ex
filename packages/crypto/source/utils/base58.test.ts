import { describe } from "@arkecosystem/core-test-framework";
import { HashAlgorithms } from "../crypto";
import { Base58 } from "./base58";

const createPayload = () => {
	const buffer: Buffer = HashAlgorithms.ripemd160(
		Buffer.from("034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192", "hex"),
	);
	const payload: Buffer = Buffer.alloc(21);

	payload.writeUInt8(30, 0);
	buffer.copy(payload, 1);

	return payload;
};

describe("Base58", ({ it, assert }) => {
	it("encodeCheck", () => {
		assert.equal(Base58.encodeCheck(createPayload()), "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
	});

	it("decodeCheck", () => {
		assert.equal(Base58.decodeCheck("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib"), createPayload());
	});
});
