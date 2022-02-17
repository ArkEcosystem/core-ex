import { WalletIndexAlreadyRegisteredError, WalletIndexNotFoundError, WalletsError } from "./errors";
import { describe } from "@arkecosystem/core-test";

describe("WalletErrors", ({ it, assert }) => {
	it("should construct base wallet error", () => {
		const message = "I am an error";
		const error = new WalletsError(message);

		assert.throws(() => {
			throw error;
		}, undefined, message);

		assert.defined(error.stack);
	});

	it("should construct WalletIndexAlreadyRegisteredError", () => {
		const message = "custom message";
		const error = new WalletIndexAlreadyRegisteredError(message);

		assert.throws(() => {
			throw error;
		}, undefined, `The wallet index is already registered: ${message}`);

		assert.defined(error.stack);
	});

	it("should construct WalletIndexNotFoundError", () => {
		const message = "custom message";
		const error = new WalletIndexNotFoundError(message);

		assert.throws(() => {
			throw error;
		}, undefined, `The wallet index does not exist: ${message}`);

		assert.defined(error.stack);
	});
});
