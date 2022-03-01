import { Wallets } from "../";
import { WalletIndex } from "./";
import { setUp } from "../../test/setup";
import { describe } from "@arkecosystem/core-test-framework";
import { Factory } from "@arkecosystem/core-test-framework/distribution/factories/factory";

let factory: Factory;

let wallet: Wallets.Wallet;
let walletIndex: WalletIndex;

const beforeAllCallback = async () => {
	const initialEnv = await setUp();

	factory = initialEnv.factory.get("Wallet");
};

const beforeEachCallback = () => {
	wallet = factory.make<Wallets.Wallet>();

	walletIndex = new WalletIndex((index, wallet) => {
		index.set(wallet.getAddress(), wallet);
	}, true);
};

describe("WalletIndex", ({ it, beforeAll, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should return entries", () => {
		walletIndex.index(wallet);
		const entries = walletIndex.entries();

		assert.equal(entries.length, 1);
		assert.equal(entries[0][0], entries[0][1].getAddress());
		assert.equal(entries[0][0], wallet.getAddress());
	});

	it("should return keys", () => {
		walletIndex.index(wallet);

		assert.true(walletIndex.keys().includes(wallet.getAddress()));
	});

	it("should return walletKeys", () => {
		assert.equal(walletIndex.walletKeys(wallet), []);

		walletIndex.index(wallet);

		assert.equal(walletIndex.walletKeys(wallet), [wallet.getAddress()]);
	});
});

describe("set", ({ it, beforeAll, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should set and get addresses", () => {
		assert.false(walletIndex.has(wallet.getAddress()));

		walletIndex.index(wallet);
		walletIndex.set(wallet.getAddress(), wallet);

		assert.equal(walletIndex.get(wallet.getAddress()), wallet);
		assert.true(walletIndex.has(wallet.getAddress()));

		assert.true(walletIndex.values().includes(wallet));

		walletIndex.clear();
		assert.false(walletIndex.has(wallet.getAddress()));
	});

	it("should override key with new wallet", () => {
		const anotherWallet = factory.make<Wallets.Wallet>();

		walletIndex.set("key1", wallet);
		walletIndex.set("key1", anotherWallet);

		assert.equal(walletIndex.get("key1"), anotherWallet);

		const entries = walletIndex.entries();

		assert.equal(entries.length, 1);
	});
});

describe("forget", ({ it, beforeAll, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should index and forget wallets", () => {
		assert.false(walletIndex.has(wallet.getAddress()));

		walletIndex.index(wallet);
		assert.true(walletIndex.has(wallet.getAddress()));

		walletIndex.forget(wallet.getAddress());
		assert.false(walletIndex.has(wallet.getAddress()));
	});

	it("should not throw if key is not indexed", () => {
		walletIndex.forget(wallet.getAddress());
	});
});

describe("forgetWallet", ({ it, beforeAll, beforeEach, assert }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should forget wallet", () => {
		walletIndex.index(wallet);
		assert.equal(walletIndex.get(wallet.getAddress()), wallet);

		walletIndex.forgetWallet(wallet);
		assert.undefined(walletIndex.get(wallet.getAddress()));
	});

	it("should not throw if wallet is not indexed", () => {
		walletIndex.forgetWallet(wallet);
	});
});
