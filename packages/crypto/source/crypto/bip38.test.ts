import { describe } from "@arkecosystem/core-test-framework";
import { base58 } from "bstring";
import ByteBuffer from "bytebuffer";
import wif from "wif";
import { bip38 } from "./";
import * as errors from "../errors";
import { Base58 } from "../utils/base58";
import fixtures from "../../test/fixtures/bip38.json";

describe("BIP38", ({ it, assert, stub }) => {
	for (const fixture of fixtures.valid) {
		it(`decrypt - should decrypt '${fixture.description}'`, () => {
			const result = bip38.decrypt(fixture.bip38, fixture.passphrase);
			assert.equal(wif.encode(0x80, result.privateKey, result.compressed), fixture.wif);
		});
	}

	for (const fixture of fixtures.invalid.verify) {
		it(`decrypt - should not decrypt '${fixture.description}'`, () => {
			try {
				bip38.decrypt(fixture.base58, "foobar");
			} catch (error) {
				assert.instance(error, errors[fixture.error.type] || Error);
				assert.equal(error.message, fixture.error.message);
			}
		});
	}

	it("decrypt - should throw if compression flag is different than 0xe0 0xc0", () => {
		stub(Base58, "decodeCheck").callsFake(() => {
			const byteBuffer = new ByteBuffer(512, true);
			byteBuffer.writeUint8(0x01);
			byteBuffer.writeUint8(0x42); // type
			byteBuffer.writeUint8(0x01); // flag

			const buffer: any = Buffer.from(byteBuffer.flip().toBuffer());
			// force length to be 39
			Object.defineProperty(buffer, "length", {
				get: () => 39,
				set: () => undefined,
			});
			return buffer;
		});

		assert.throws(() => bip38.decrypt("", ""));
	});

	for (const fixture of fixtures.valid) {
		if (!fixture.decryptOnly) {
			it(`encrypt - should encrypt '${fixture.description}'`, () => {
				const buffer = Base58.decodeCheck(fixture.wif);
				const actual = bip38.encrypt(buffer.slice(1, 33), !!buffer[33], fixture.passphrase);
				assert.equal(actual, fixture.bip38);
			});
		}
	}

	it("encrypt - should throw if private key buffer length is different than 32", () => {
		const byteBuffer = new ByteBuffer(512, true);
		byteBuffer.writeUint8(0x01);
		const buffer = Buffer.from(byteBuffer.toBuffer());

		assert.throws(
			() => bip38.encrypt(buffer, true, ""),
			(err) => err instanceof errors.PrivateKeyLengthError,
		);
	});

	for (const fixture of fixtures.valid) {
		it(`verify - should verify '${fixture.bip38}'`, () => {
			assert.true(bip38.verify(fixture.bip38));
		});
	}

	for (const fixture of fixtures.invalid.verify) {
		it(`verify - should not verify '${fixture.description}'`, () => {
			assert.false(bip38.verify(fixture.base58));
		});
	}

	it("verify - should return false if encrypted WIF flag is different than 0xc0 0xe0", () => {
		stub(base58, "decode").callsFake(() => {
			const byteBuffer = new ByteBuffer(512, true);
			byteBuffer.writeUint8(0x01);
			byteBuffer.writeUint8(0x42); // type
			byteBuffer.writeUint8(0x01); // flag

			const buffer: any = Buffer.from(byteBuffer.flip().toBuffer());
			Object.defineProperty(buffer, "length", {
				get: () => 39,
				set: () => undefined,
			});
			return buffer;
		});

		assert.false(bip38.verify("yo"));
	});

	it("verify - should return false if encrypted EC mult flag is different than 0x24", () => {
		stub(base58, "decode").callsFake(() => {
			const byteBuffer = new ByteBuffer(512, true);
			byteBuffer.writeUint8(0x01);
			byteBuffer.writeUint8(0x43); // type
			byteBuffer.writeUint8(0x01); // flag

			const buffer: any = Buffer.from(byteBuffer.flip().toBuffer());
			Object.defineProperty(buffer, "length", {
				get: () => 43,
				set: () => undefined,
			});
			return buffer;
		});

		assert.false(bip38.verify("yo"));
	});
});
