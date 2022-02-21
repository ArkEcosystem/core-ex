import "jest-extended";

import { data, mnemonic } from "../test/identity.json";
import { devnet } from "../test/networks.json";
import { PrivateKey } from "./private-key";

describe("Identities - Private Key", () => {
	describe("fromMnemonic", () => {
		it("should be OK", () => {
			expect(PrivateKey.fromMnemonic(mnemonic)).toBe(data.privateKey);
		});
	});

	describe("fromWIF", () => {
		it("should be OK", () => {
			expect(PrivateKey.fromWIF(data.wif, devnet)).toBe(data.privateKey);
		});
	});
});
