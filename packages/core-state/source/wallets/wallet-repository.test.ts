import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Wallet, WalletRepository } from "./";
import { addressesIndexer, publicKeysIndexer, resignationsIndexer, usernamesIndexer } from "./indexers";
import { Utils } from "@arkecosystem/crypto";
import { setUp } from "../../test/setup";
import { describe } from "@arkecosystem/core-test-framework";

let walletRepo: WalletRepository;

const beforeAllCallback = async () => {
	const initialEnv = await setUp();

	// TODO: why does this have to be rebound here?
	initialEnv.sandbox.app.rebind(Container.Identifiers.WalletRepository).to(WalletRepository);
	walletRepo = initialEnv.sandbox.app.getTagged(Container.Identifiers.WalletRepository, "state", "blockchain");
};

const beforeEachCallback = () => {
	walletRepo.reset();
};

describe("Wallet Repository", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should throw if indexers are already registered", () => {
		assert.throws(() => walletRepo.initialize(), "The wallet index is already registered: addresses");
	});

	it("should create a wallet", () => {
		const wallet = walletRepo.createWallet("abcd");

		assert.equal(wallet.getAddress(), "abcd");
		assert.instance(wallet, Wallet);
	});

	it("should be able to look up indexers", () => {
		const expected = ["addresses", "publicKeys", "usernames", "resignations"];

		assert.equal(walletRepo.getIndexNames(), expected);
		assert.equal(walletRepo.getIndex("addresses").indexer, addressesIndexer);
		assert.equal(walletRepo.getIndex("publicKeys").indexer, publicKeysIndexer);
		assert.equal(walletRepo.getIndex("usernames").indexer, usernamesIndexer);
		assert.equal(walletRepo.getIndex("resignations").indexer, resignationsIndexer);
		assert.throws(() => walletRepo.getIndex("iDontExist"));
	});

	it("indexing should keep indexers in sync", () => {
		const address = "ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp";
		const wallet = walletRepo.createWallet(address);
		const publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
		wallet.setPublicKey(publicKey);

		assert.not.equal(walletRepo.findByAddress(address), wallet);

		walletRepo.getIndex("publicKeys").set(publicKey, wallet);

		assert.defined(walletRepo.findByPublicKey(publicKey).getPublicKey());
		assert.equal(walletRepo.findByPublicKey(publicKey), wallet);

		assert.undefined(walletRepo.findByAddress(address).getPublicKey());
		assert.not.equal(walletRepo.findByAddress(address), wallet);

		walletRepo.index(wallet);

		assert.equal(walletRepo.findByAddress(address).getPublicKey(), publicKey);
		assert.equal(walletRepo.findByAddress(address), wallet);
	});

	it("should get and set wallets by address", () => {
		const address = "abcd";
		const wallet = walletRepo.createWallet(address);

		assert.false(walletRepo.has(address));

		assert.equal(walletRepo.findByAddress(address), wallet);
		assert.true(walletRepo.has(address));

		assert.equal(walletRepo.findByIndex("addresses", address), wallet);
		const nonExistingAddress = "abcde";
		assert.true(walletRepo.has(address));
		assert.false(walletRepo.has(nonExistingAddress));
		assert.true(walletRepo.hasByAddress(address));
		assert.false(walletRepo.hasByAddress(nonExistingAddress));
		assert.true(walletRepo.hasByIndex("addresses", address));
		assert.false(walletRepo.hasByIndex("addresses", nonExistingAddress));
		assert.equal(walletRepo.allByAddress(), [wallet]);
		assert.equal(walletRepo.allByIndex("addresses"), [wallet]);
	});

	it("should create a wallet if one is not found during address lookup", () => {
		assert.not.throws(() => walletRepo.findByAddress("hello"));
		assert.instance(walletRepo.findByAddress("iDontExist"), Wallet);
		assert.true(walletRepo.has("hello"));
		assert.true(walletRepo.hasByAddress("iDontExist"));

		const errorMessage = "Wallet iAlsoDontExist doesn't exist in index addresses";
		assert.throws(() => walletRepo.findByIndex("addresses", "iAlsoDontExist"), errorMessage);
	});

	it("should get and set wallets by public key", () => {
		const wallet = walletRepo.createWallet("abcde");
		const publicKey = "02337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
		walletRepo.getIndex("publicKeys").set(publicKey, wallet);
		assert.equal(walletRepo.findByPublicKey(publicKey), wallet);
		assert.equal(walletRepo.findByIndex("publicKeys", publicKey), wallet);

		const nonExistingPublicKey = "98727416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";

		assert.true(walletRepo.has(publicKey));
		assert.false(walletRepo.has(nonExistingPublicKey));
		assert.true(walletRepo.hasByPublicKey(publicKey));
		assert.false(walletRepo.hasByPublicKey(nonExistingPublicKey));
		assert.true(walletRepo.hasByIndex("publicKeys", publicKey));
		assert.false(walletRepo.hasByIndex("publicKeys", nonExistingPublicKey));
		assert.equal(walletRepo.allByPublicKey(), [wallet]);
		assert.equal(walletRepo.allByIndex("publicKeys"), [wallet]);
	});

	it("should create a wallet if one is not found during public key lookup", () => {
		const firstNotYetExistingPublicKey = "0235d486fea0193cbe77e955ab175b8f6eb9eaf784de689beffbd649989f5d6be3";
		assert.not.throws(() => walletRepo.findByPublicKey(firstNotYetExistingPublicKey));
		assert.instance(walletRepo.findByPublicKey(firstNotYetExistingPublicKey), Wallet);

		const secondNotYetExistingPublicKey = "03a46f2547d20b47003c1c376788db5a54d67264df2ae914f70bf453b6a1fa1b3a";
		assert.throws(() => walletRepo.findByIndex("publicKeys", secondNotYetExistingPublicKey));
	});

	it("should get and set wallets by username", () => {
		const username = "testUsername";
		const wallet = walletRepo.createWallet("abcdef");

		walletRepo.getIndex("usernames").set(username, wallet);
		assert.equal(walletRepo.findByUsername(username), wallet);
		assert.equal(walletRepo.findByIndex("usernames", username), wallet);

		const nonExistingUsername = "iDontExistAgain";
		assert.true(walletRepo.has(username));
		assert.false(walletRepo.has(nonExistingUsername));
		assert.true(walletRepo.hasByUsername(username));
		assert.false(walletRepo.hasByUsername(nonExistingUsername));
		assert.true(walletRepo.hasByIndex("usernames", username));
		assert.false(walletRepo.hasByIndex("usernames", nonExistingUsername));
		assert.equal(walletRepo.allByUsername(), [wallet]);
		assert.equal(walletRepo.allByIndex("usernames"), [wallet]);
	});

	it("should be able to index forgotten wallets", () => {
		const wallet1 = walletRepo.createWallet("wallet1");
		walletRepo.index(wallet1);
		assert.true(walletRepo.has("wallet1"));
		walletRepo.index(wallet1);
		assert.true(walletRepo.has("wallet1"));
	});

	it("should do nothing if forgotten wallet does not exist", () => {
		const wallet1 = walletRepo.createWallet("wallet1");
		walletRepo.index(wallet1);
		// @ts-ignore
		wallet1.publicKey = undefined;
		assert.false(walletRepo.has("wallet2"));
	});

	it("should index array of wallets using different indexers", () => {
		const wallets: Contracts.State.Wallet[] = [];
		const walletAddresses: string[] = [];
		for (let i = 0; i < 6; i++) {
			const walletAddress = `wallet${i}`;
			walletAddresses.push(walletAddress);
			const wallet = walletRepo.createWallet(walletAddress);
			wallets.push(wallet);
		}

		for (const wallet of wallets) {
			walletRepo.index(wallet);
		}

		walletAddresses.forEach((address) => assert.true(walletRepo.has(address)));

		const publicKey = "02511f16ffb7b7e9afc12f04f317a11d9644e4be9eb5a5f64673946ad0f6336f34";

		walletRepo.getIndex("publicKeys").set(publicKey, wallets[1]);
		walletRepo.getIndex("usernames").set("username", wallets[2]);
		walletRepo.getIndex("resignations").set("resign", wallets[3]);

		wallets.forEach((wallet) => walletRepo.index(wallet));

		walletAddresses.forEach((address) => assert.true(walletRepo.has(address)));
	});

	it("should get the nonce of a wallet", () => {
		const wallet1 = walletRepo.createWallet("wallet1");
		wallet1.setNonce(Utils.BigNumber.make(100));
		wallet1.setPublicKey("02511f16ffb7b7e9afc12f04f317a11d9644e4be9eb5a5f64673946ad0f6336f34");
		walletRepo.index(wallet1);

		assert.equal(walletRepo.getNonce(wallet1.getPublicKey()!), Utils.BigNumber.make(100));
	});

	it("should return 0 nonce if there is no wallet", () => {
		const publicKey = "03c075494ad044ab8c0b2dc7ccd19f649db844a4e558e539d3ac2610c4b90a5139";
		assert.equal(walletRepo.getNonce(publicKey), Utils.BigNumber.ZERO);
	});

	it("should throw when looking up a username which doesn't exist", () => {
		assert.throws(() => walletRepo.findByUsername("iDontExist"), "Wallet iDontExist doesn't exist in index usernames");

		assert.throws(() => walletRepo.findByIndex("usernames", "iDontExist"), "Wallet iDontExist doesn't exist in index usernames");
	});
});

describe("allByIndex", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should return values on index", () => {
		const wallet = walletRepo.findByAddress("address");

		assert.equal(walletRepo.allByIndex("addresses"), [wallet]);
	});
});

describe("setOnIndex", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should set wallet on index", () => {
		const wallet = walletRepo.findByAddress("address");
		walletRepo.setOnIndex("addresses", "address2", wallet);

		assert.equal(walletRepo.allByIndex("addresses"), [wallet, wallet]);
	});
});

describe("forgetOnIndex", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should forget wallet on index", () => {
		const wallet = walletRepo.findByAddress("address");
		assert.equal(walletRepo.allByIndex("addresses"), [wallet]);

		walletRepo.forgetOnIndex("addresses", "address");

		assert.equal(walletRepo.allByIndex("addresses"), []);
	});
});
