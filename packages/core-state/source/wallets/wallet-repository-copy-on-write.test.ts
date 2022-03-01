import { Contracts } from "@arkecosystem/core-kernel";
import { Wallet, WalletRepository, WalletRepositoryCopyOnWrite } from "./";
import { addressesIndexer, publicKeysIndexer, resignationsIndexer, usernamesIndexer } from "./indexers";
import { Utils } from "@arkecosystem/crypto";
import { setUp } from "../../test/setup";
import { describe } from "@arkecosystem/core-test-framework";

let walletRepoCopyOnWrite: WalletRepositoryCopyOnWrite;
let walletRepo: WalletRepository;

const beforeAllCallback = async () => {
	const initialEnv = await setUp();
	walletRepoCopyOnWrite = initialEnv.walletRepoCopyOnWrite;
	walletRepo = initialEnv.walletRepo;
};

const beforeEachCallback = () => {
	walletRepoCopyOnWrite.reset();
	walletRepo.reset();
};

describe("Wallet Repository Copy On Write", ({ it, assert, beforeEach, beforeAll, skip, spy }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should create a wallet", () => {
		const wallet = walletRepoCopyOnWrite.createWallet("abcd");
		assert.equal(wallet.getAddress(), "abcd");
		assert.instance(wallet, Wallet);
	});

	it("should be able to look up indexers", () => {
		const expected = ["addresses", "publicKeys", "usernames", "resignations"];
		assert.equal(walletRepoCopyOnWrite.getIndexNames(), expected);
		assert.equal(walletRepoCopyOnWrite.getIndex("addresses").indexer, addressesIndexer);
		assert.equal(walletRepoCopyOnWrite.getIndex("publicKeys").indexer, publicKeysIndexer);
		assert.equal(walletRepoCopyOnWrite.getIndex("usernames").indexer, usernamesIndexer);
		assert.equal(walletRepoCopyOnWrite.getIndex("resignations").indexer, resignationsIndexer);
	});

	it("should find wallets by address", () => {
		const spyFindByAddress = spy(walletRepo, "findByAddress");
		const clonedWallet = walletRepoCopyOnWrite.findByAddress("notexisting");

		spyFindByAddress.calledWith("notexisting");

		const originalWallet = walletRepo.findByAddress(clonedWallet.getAddress());

		assert.not.equal(originalWallet, clonedWallet);
	});

	it("should get all by username", () => {
		const wallet1 = walletRepoCopyOnWrite.createWallet("abcd");
		const wallet2 = walletRepoCopyOnWrite.createWallet("efg");
		const wallet3 = walletRepoCopyOnWrite.createWallet("hij");

		wallet1.setAttribute("delegate.username", "username1");
		wallet2.setAttribute("delegate.username", "username2");
		wallet3.setAttribute("delegate.username", "username3");

		const allWallets = [wallet1, wallet2, wallet3];
		walletRepo.index(allWallets);

		assert.true(walletRepoCopyOnWrite.allByUsername().some(w => w.getAddress() === wallet1.getAddress()));
		assert.true(walletRepoCopyOnWrite.allByUsername().some(w => w.getAddress() === wallet2.getAddress()));
		assert.true(walletRepoCopyOnWrite.allByUsername().some(w => w.getAddress() === wallet3.getAddress()));

		const wallet4 = walletRepoCopyOnWrite.createWallet("klm");
		wallet4.setAttribute("delegate.username", "username4");

		walletRepo.index(wallet4);
		allWallets.push(wallet4);

		assert.true(walletRepoCopyOnWrite.allByUsername().some(w => w.getAddress() === wallet1.getAddress()));
		assert.true(walletRepoCopyOnWrite.allByUsername().some(w => w.getAddress() === wallet2.getAddress()));
		assert.true(walletRepoCopyOnWrite.allByUsername().some(w => w.getAddress() === wallet3.getAddress()));
		assert.true(walletRepoCopyOnWrite.allByUsername().some(w => w.getAddress() === wallet4.getAddress()));
	});

	// TODO: test behaves differently to WalletRepository due to inheritance
	skip("findByPublicKey should index wallet", () => {
		const address = "ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp";
		const wallet = walletRepoCopyOnWrite.createWallet(address);
		const publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
		wallet.setPublicKey(publicKey);

		assert.not.equal(walletRepoCopyOnWrite.findByAddress(address), wallet);
		walletRepoCopyOnWrite.getIndex("publicKeys").set(publicKey, wallet);
		assert.defined(walletRepoCopyOnWrite.findByPublicKey(publicKey).getPublicKey());
		assert.equal(walletRepoCopyOnWrite.findByPublicKey(publicKey), wallet);

		assert.defined(walletRepoCopyOnWrite.findByAddress(address).getPublicKey());
		assert.equal(walletRepoCopyOnWrite.findByAddress(address), wallet);
	});

	// TODO: test behaves differently to WalletRepository due to inheritance
	skip("should not retrieve wallets indexed in original repo, until they are indexed", () => {
		const address = "abcd";

		const wallet = walletRepoCopyOnWrite.createWallet(address);
		walletRepoCopyOnWrite.index(wallet);

		assert.false(walletRepoCopyOnWrite.has(address));
		assert.false(walletRepoCopyOnWrite.hasByAddress(address));
		assert.false(walletRepoCopyOnWrite.hasByIndex("addresses", address));

		assert.equal(walletRepoCopyOnWrite.allByAddress(), [wallet]);

		walletRepo.index(wallet);

		assert.true(walletRepoCopyOnWrite.has(address));
		assert.true(walletRepoCopyOnWrite.hasByAddress(address));
		assert.true(walletRepoCopyOnWrite.hasByIndex("addresses", address));
		assert.equal(walletRepoCopyOnWrite.allByAddress(), [wallet]);

		// TODO: similarly, this behaviour is odd - as the code hasn't been overwritten in the extended class
		assert.true(walletRepoCopyOnWrite.has(address));
	});

	// TODO: test behaves differently to WalletRepository due to i
	skip("should create a wallet if one is not found during address lookup", () => {
		assert.not.throws(() => walletRepoCopyOnWrite.findByAddress("hello"));
		assert.instance(walletRepoCopyOnWrite.findByAddress("iDontExist"), Wallet);
		assert.false(walletRepoCopyOnWrite.has("hello"));
		assert.false(walletRepoCopyOnWrite.hasByAddress("iDontExist"));

		assert.not.throws(() => walletRepoCopyOnWrite.findByIndex("addresses", "iAlsoDontExist"));
	});
});

describe("index", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	// TODO: test behaves differently to WalletRepository due to inheritance
	it.skip("should not affect the original", () => {
		const wallet = walletRepo.createWallet("abcdef");
		walletRepo.index(wallet);

		walletRepoCopyOnWrite.index(wallet);

		assert.not.equal(walletRepo.findByAddress(wallet.getAddress()), walletRepoCopyOnWrite.findByAddress(wallet.getAddress()));
	});
});

describe("findByAddress", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should return a copy", () => {
		const wallet = walletRepo.createWallet("abcdef");
		walletRepo.index(wallet);

		const tempWallet = walletRepoCopyOnWrite.findByAddress(wallet.getAddress());
		tempWallet.setBalance(Utils.BigNumber.ONE);

		assert.not.equal(wallet.getBalance(), tempWallet.getBalance());
	});
});

describe("findByPublicKey", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should return a copy", () => {
		const wallet = walletRepo.createWallet("ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp");
		wallet.setPublicKey("03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece");
		wallet.setBalance(Utils.BigNumber.SATOSHI);
		walletRepo.index(wallet);

		const tempWallet = walletRepoCopyOnWrite.findByPublicKey(wallet.getPublicKey()!);
		tempWallet.setBalance(Utils.BigNumber.ZERO);

		assert.equal(wallet.getBalance(), Utils.BigNumber.SATOSHI);
		assert.equal(tempWallet.getBalance(), Utils.BigNumber.ZERO);
	});
});

describe("findByUsername", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should return a copy", () => {
		const wallet = walletRepo.createWallet("abcdef");
		wallet.setAttribute("delegate", { username: "test" });
		walletRepo.index(wallet);

		const tempWallet = walletRepoCopyOnWrite.findByUsername(wallet.getAttribute("delegate.username"));
		tempWallet.setBalance(Utils.BigNumber.ONE);

		assert.not.equal(wallet.getBalance(), tempWallet.getBalance());
	});
});

describe("hasByAddress", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should be ok", () => {
		const wallet = walletRepo.createWallet("abcdef");
		walletRepo.index(wallet);

		assert.true(walletRepoCopyOnWrite.hasByAddress(wallet.getAddress()));
	});
});

describe("hasByPublicKey", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should be ok", () => {
		const wallet = walletRepo.createWallet("ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp");
		wallet.setPublicKey("03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece");
		walletRepo.index(wallet);

		assert.true(walletRepoCopyOnWrite.hasByPublicKey(wallet.getPublicKey()!));
	});
});

describe("hasByUsername", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should be ok", () => {
		const wallet = walletRepo.createWallet("abcdef");
		wallet.setAttribute("delegate", { username: "test" });
		walletRepo.index(wallet);

		assert.true(walletRepoCopyOnWrite.hasByUsername(wallet.getAttribute("delegate.username")));
	});
});

describe("hasByIndex", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should be ok", () => {
		const wallet = walletRepo.createWallet("abc");
		wallet.setAttribute("delegate", { username: "test" });
		walletRepo.index(wallet);

		assert.true(walletRepoCopyOnWrite.hasByIndex(Contracts.State.WalletIndexes.Usernames, "test"));
	});
});

describe("findByIndex", ({ it, assert, beforeEach, beforeAll }) => {
	beforeEach(beforeEachCallback);
	beforeAll(beforeAllCallback);

	it("should be ok", () => {
		const wallet = walletRepo.createWallet("abc");
		wallet.setAttribute("delegate", { username: "test" });
		walletRepo.index(wallet);
		const clone = walletRepoCopyOnWrite.findByIndex(Contracts.State.WalletIndexes.Usernames, "test");

		assert.not.equal(clone, wallet);
		assert.equal(clone.getAddress(), wallet.getAddress());
		assert.equal(clone.getAttribute("delegate.username"), wallet.getAttribute("delegate.username"));
	});
});
