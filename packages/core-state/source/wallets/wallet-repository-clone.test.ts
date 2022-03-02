import { Utils } from "@arkecosystem/crypto";
import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { addressesIndexer, publicKeysIndexer, usernamesIndexer, Wallet, WalletRepository, WalletRepositoryClone } from "./";
import { walletFactory } from "./wallet-factory";
import { Sandbox, describe } from "@arkecosystem/core-test-framework";

let sandbox: Sandbox;
let walletRepositoryBlockchain: WalletRepository;
let walletRepositoryClone: WalletRepositoryClone;

const beforeEachCallback = () => {
	sandbox = new Sandbox();

	sandbox.app.bind(Container.Identifiers.WalletAttributes).to(Services.Attributes.AttributeSet).inSingletonScope();

	sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate");
	sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate.username");
	sandbox.app
		.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
		.set("delegate.voteBalance");
	sandbox.app
		.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
		.set("delegate.producedBlocks");
	sandbox.app
		.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
		.set("delegate.forgedTotal");
	sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate.approval");
	sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate.resigned");
	sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate.rank");
	sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate.round");
	sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("usernames");

	sandbox.app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Contracts.State.WalletIndexes.Addresses,
		indexer: addressesIndexer,
		autoIndex: true,
	});

	sandbox.app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Contracts.State.WalletIndexes.PublicKeys,
		indexer: publicKeysIndexer,
		autoIndex: true,
	});

	sandbox.app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
		name: Contracts.State.WalletIndexes.Usernames,
		indexer: usernamesIndexer,
		autoIndex: true,
	});

	sandbox.app
		.bind(Container.Identifiers.WalletFactory)
		.toFactory(({ container }) => {
			return walletFactory(container.get(Container.Identifiers.WalletAttributes));
		})
		.when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));

	sandbox.app
		.bind(Container.Identifiers.WalletFactory)
		.toFactory(({ container }) => {
			return walletFactory(container.get(Container.Identifiers.WalletAttributes));
		})
		.when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "clone"));

	sandbox.app
		.bind(Container.Identifiers.WalletRepository)
		.to(WalletRepository)
		.inSingletonScope()
		.when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));

	sandbox.app
		.bind(Container.Identifiers.WalletRepository)
		.to(WalletRepositoryClone)
		.inSingletonScope()
		.when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "clone"));

	walletRepositoryBlockchain = sandbox.app.getTagged<WalletRepositoryClone>(
		Container.Identifiers.WalletRepository,
		"state",
		"blockchain",
	);

	walletRepositoryClone = sandbox.app.getTagged<WalletRepositoryClone>(
		Container.Identifiers.WalletRepository,
		"state",
		"clone",
	);
};

describe("initialize", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should throw if wallet index is already registered", () => {
		assert.throws(() => {
			walletRepositoryClone.initialize();
		});
	});
});

describe("createWallet", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should create wallet by address", () => {
		const wallet = walletRepositoryClone.createWallet("address");

		assert.instance(wallet, Wallet);
		assert.equal(wallet.getAddress(), "address");
	});
});

describe("getIndex", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should return wallet repository clone index", () => {
		walletRepositoryBlockchain.findByAddress("address_1");
		const wallet = walletRepositoryClone.findByAddress("address_2");

		assert.equal(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).values(), [wallet]);
	});
});

describe("getIndexNames", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should return index names", () => {
		assert.equal(walletRepositoryClone.getIndexNames(), ["addresses", "publicKeys", "usernames"]);
	});
});

describe("index", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should index single wallet if there are no changes in indexes", () => {
		const wallet = walletRepositoryClone.findByAddress("address");

		walletRepositoryClone.index(wallet);
	});

	it("should index single wallet if wallet change results in set on index", () => {
		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.setAttribute("delegate.username", "genesis_1");

		assert.false(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("genesis_1"));

		walletRepositoryClone.index(wallet);

		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("genesis_1"));
	});

	it("should index single wallet if wallet change results in forget on index", () => {
		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryClone.index(wallet);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("genesis_1"));

		wallet.forgetAttribute("delegate");
		walletRepositoryClone.index(wallet);

		assert.false(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("genesis_1"));

		assert.true(
			// @ts-ignore
			walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].has("genesis_1"),
		);
	});

	it("should index wallet array", () => {
		const wallet1 = walletRepositoryClone.findByAddress("address_1");
		const wallet2 = walletRepositoryClone.findByAddress("address_2");

		walletRepositoryClone.index([wallet1, wallet2]);
	});
});

describe("forgetOnIndex", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should clone wallet and set key on forget index if key exists only on blockchain wallet repository", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
		walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.Usernames).set("key", blockchainWallet);

		walletRepositoryClone.forgetOnIndex(Contracts.State.WalletIndexes.Usernames, "key");

		assert.false(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("key"));
		// @ts-ignore
		assert.true(walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].has("key"));
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has("address"));
	});

	it("should set key on forget index if key exists on wallet repository clone", () => {
		const wallet = walletRepositoryClone.findByAddress("address");
		walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).set("key", wallet);
		assert.true(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "key"));

		walletRepositoryClone.forgetOnIndex(Contracts.State.WalletIndexes.Usernames, "key");

		assert.false(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("key"));
		// @ts-ignore
		assert.true(walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].has("key"));
		assert.false(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "key"));
	});

	it("should skip setting key if does not exist", () => {
		walletRepositoryClone.forgetOnIndex(Contracts.State.WalletIndexes.Usernames, "key");

		// @ts-ignore
		assert.false(walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].has("key"));
	});
});

describe("findByAddress", ({ it, assert, beforeEach, spy }) => {
	beforeEach(beforeEachCallback);

	it.skip("should copy and index wallet from blockchain wallet repository if exist in blockchain wallet repository", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
		assert.true(walletRepositoryBlockchain.hasByAddress("address"));
		walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.Usernames).set("key", blockchainWallet);

		const wallet = walletRepositoryClone.findByAddress("address");

		assert.not.equal(wallet, blockchainWallet);
		assert.equal(wallet, blockchainWallet);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has("address"));
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("key"));
	});

	it("should create and index new wallet if does not exist in blockchain wallet repository", () => {
		const wallet = walletRepositoryClone.findByAddress("address");

		assert.instance(wallet, Wallet);
		assert.equal(wallet.getAddress(), "address");
		assert.true(walletRepositoryClone.hasByAddress("address"));
		assert.false(walletRepositoryBlockchain.hasByAddress("address"));
	});

	it("should return existing wallet", () => {
		const spyOnCreateWallet = spy(walletRepositoryClone, "createWallet");

		const wallet = walletRepositoryClone.findByAddress("address");

		assert.instance(wallet, Wallet);
		assert.equal(wallet.getAddress(), "address");
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has("address"));
		spyOnCreateWallet.calledOnce();

		spyOnCreateWallet.reset();

		const existingWallet = walletRepositoryClone.findByAddress("address");

		assert.equal(wallet, existingWallet);
		spyOnCreateWallet.neverCalled();
		assert.false(walletRepositoryBlockchain.hasByAddress("address"));
	});
});

describe("findByPublicKey", ({ it, assert, beforeEach, skip, spy }) => {
	beforeEach(beforeEachCallback);

	const publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

	skip("should copy and index wallet from blockchain wallet repository if exist in blockchain wallet repository", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByPublicKey(publicKey);
		assert.true(walletRepositoryBlockchain.hasByPublicKey(publicKey));
		walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.Usernames).set("key", blockchainWallet);

		const wallet = walletRepositoryClone.findByPublicKey(publicKey);

		assert.instance(wallet, Wallet);
		assert.equal(wallet.getPublicKey(), publicKey);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey));
		assert.true(
			walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has(wallet.getAddress()),
		);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("key"));

		assert.not.equal(wallet, blockchainWallet);
		assert.equal(wallet, blockchainWallet);
	});

	it("should create and index new wallet if does not exist in blockchain wallet repository", () => {
		const wallet = walletRepositoryClone.findByPublicKey(publicKey);

		assert.instance(wallet, Wallet);
		assert.equal(wallet.getPublicKey(), publicKey);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey));
		assert.true(
			walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has(wallet.getAddress()),
		);

		assert.false(walletRepositoryBlockchain.hasByPublicKey(publicKey));
		assert.false(walletRepositoryBlockchain.hasByAddress(wallet.getAddress()));
	});

	it("should return existing wallet", () => {
		const spyOnCreateWallet = spy(walletRepositoryClone, "createWallet");

		const wallet = walletRepositoryClone.findByPublicKey(publicKey);

		assert.instance(wallet, Wallet);
		assert.equal(wallet.getPublicKey(), publicKey);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey));
		spyOnCreateWallet.calledOnce();

		spyOnCreateWallet.reset();
		const existingWallet = walletRepositoryClone.findByPublicKey(publicKey);

		assert.equal(wallet, existingWallet);
		spyOnCreateWallet.neverCalled();
		assert.false(walletRepositoryBlockchain.hasByPublicKey(publicKey));
	});
});

describe("findByUsername", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should copy and index wallet from blockchain wallet repository if exist in blockchain wallet repository", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
		blockchainWallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryBlockchain.index(blockchainWallet);
		assert.true(walletRepositoryBlockchain.hasByUsername("genesis_1"));

		const wallet = walletRepositoryClone.findByUsername("genesis_1");

		assert.not.equal(wallet, blockchainWallet);
		blockchainWallet.setPublicKey(undefined);
		assert.equal(wallet, blockchainWallet);
		assert.equal(wallet.getAttribute("delegate.username"), "genesis_1");
		assert.true(walletRepositoryClone.hasByUsername("genesis_1"));
	});

	it("should return existing wallet", () => {
		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryClone.index(wallet);

		const existingWallet = walletRepositoryClone.findByUsername("genesis_1");
		assert.equal(wallet, existingWallet);
	});

	it("should throw error if wallet does not exist in blockchain or copy wallet repository", () => {
		assert.throws(() => {
			walletRepositoryClone.findByUsername("genesis_1");
		}, "Wallet genesis_1 doesn't exist in index usernames");
	});
});

describe("findByIndexes", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should copy and index wallet from blockchain wallet repository if key exist in blockchain wallet repository", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");

		assert.equal(walletRepositoryBlockchain.findByIndexes(["addresses"], "address"), blockchainWallet);
		assert.not.equal(walletRepositoryClone.findByIndexes(["addresses"], "address"), blockchainWallet);

		blockchainWallet.setPublicKey(undefined);

		assert.equal(walletRepositoryClone.findByIndexes(["addresses"], "address"), blockchainWallet);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has("address"));
	});

	it("should return wallet from wallet repository clone", () => {
		const wallet = walletRepositoryClone.findByAddress("address");

		assert.equal(walletRepositoryClone.findByIndexes(["addresses"], "address"), wallet);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has("address"));
	});

	it("should throw error if wallet does not exist in blockchain or copy wallet repository", () => {
		assert.throws(() => {
			walletRepositoryClone.findByIndexes(["addresses"], "address");
		}, "Wallet address doesn't exist in indexes addresses");
	});
});

describe("findByIndex", ({ it, assert, beforeEach, spy }) => {
	beforeEach(beforeEachCallback);

	const username = "genesis_1";

	it("should copy and index wallet from blockchain wallet repository if exist in blockchain wallet repository", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
		blockchainWallet.setAttribute("delegate.username", username);
		walletRepositoryBlockchain.index(blockchainWallet);
		walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.Usernames).set("key", blockchainWallet);
		assert.true(walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, username));

		const wallet = walletRepositoryClone.findByIndex(Contracts.State.WalletIndexes.Usernames, username);

		assert.not.equal(wallet, blockchainWallet);
		blockchainWallet.setPublicKey(undefined);

		assert.equal(wallet, blockchainWallet);
		assert.equal(wallet.getAttribute("delegate.username"), username);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has(username));
		assert.true(
			walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has(wallet.getAddress()),
		);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("key"));
	});

	it("should return existing wallet", () => {
		const spyOnCreateWallet = spy(walletRepositoryClone, "createWallet");

		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.setAttribute("delegate.username", username);
		walletRepositoryClone.index(wallet);

		assert.instance(wallet, Wallet);
		assert.equal(wallet.getAddress(), "address");
		assert.equal(wallet.getAttribute("delegate.username"), username);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has(username));
		spyOnCreateWallet.calledOnce();

		spyOnCreateWallet.reset();
		const existingWallet = walletRepositoryClone.findByIndex(Contracts.State.WalletIndexes.Usernames, username);

		assert.equal(wallet, existingWallet);
		spyOnCreateWallet.neverCalled();
		assert.false(
			walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, username),
		);
	});

	it("should throw error if does not exist in blockchain wallet repository", () => {
		assert.throws(() => {
			walletRepositoryClone.findByIndex(Contracts.State.WalletIndexes.Usernames, username);
		}, "Wallet genesis_1 doesn't exist in index usernames");
	});
});

describe("has", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should return true if key exist in blockchain wallet repository", () => {
		walletRepositoryBlockchain.findByAddress("address");

		assert.true(walletRepositoryBlockchain.has("address"));
		assert.true(walletRepositoryClone.has("address"));
	});

	it("should return true if key exist in clone wallet repository", () => {
		walletRepositoryClone.findByAddress("address");

		assert.false(walletRepositoryBlockchain.has("address"));
		assert.true(walletRepositoryClone.has("address"));
	});

	it("should return false if key does not exist in clone wallet repository", () => {
		assert.false(walletRepositoryBlockchain.has("address"));
		assert.false(walletRepositoryClone.has("address"));
	});
});

describe("hasByAddress", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should return true if wallet exist in blockchain wallet repository", () => {
		walletRepositoryBlockchain.findByAddress("address");

		assert.true(walletRepositoryBlockchain.hasByAddress("address"));
		assert.true(walletRepositoryClone.hasByAddress("address"));
	});

	it("should return true if wallet exist in clone wallet repository", () => {
		walletRepositoryClone.findByAddress("address");

		assert.false(walletRepositoryBlockchain.hasByAddress("address"));
		assert.true(walletRepositoryClone.hasByAddress("address"));
	});

	it("should return false if wallet does not exist in clone wallet repository", () => {
		assert.false(walletRepositoryBlockchain.hasByAddress("address"));
		assert.false(walletRepositoryClone.hasByAddress("address"));
	});
});

describe("hasByPublicKey", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	const publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

	it("should return true if wallet exist in blockchain wallet repository", () => {
		walletRepositoryBlockchain.findByPublicKey(publicKey);

		assert.true(walletRepositoryBlockchain.hasByPublicKey(publicKey));
		assert.true(walletRepositoryClone.hasByPublicKey(publicKey));
	});

	it("should return true if wallet exist in clone wallet repository", () => {
		walletRepositoryClone.findByPublicKey(publicKey);

		assert.false(walletRepositoryBlockchain.hasByPublicKey(publicKey));
		assert.true(walletRepositoryClone.hasByPublicKey(publicKey));
	});

	it("should return false if wallet does not exist in clone wallet repository", () => {
		assert.false(walletRepositoryBlockchain.hasByPublicKey(publicKey));
		assert.false(walletRepositoryClone.hasByPublicKey(publicKey));
	});
});

describe("hasByUsername", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should return true if wallet exist in blockchain wallet repository", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
		blockchainWallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryBlockchain.index(blockchainWallet);

		assert.true(walletRepositoryBlockchain.hasByUsername("genesis_1"));
		assert.true(walletRepositoryClone.hasByUsername("genesis_1"));
	});

	it("should return true if wallet exist in clone wallet repository", () => {
		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryClone.index(wallet);

		assert.false(walletRepositoryBlockchain.hasByUsername("genesis_1"));
		assert.true(walletRepositoryClone.hasByUsername("genesis_1"));
	});

	it("should return false if wallet does not exist in clone wallet repository", () => {
		assert.false(walletRepositoryBlockchain.hasByUsername("genesis_1"));
		assert.false(walletRepositoryClone.hasByUsername("genesis_1"));
	});
});

describe("hasByIndex", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should return true if wallet exist in blockchain wallet repository", () => {
		const wallet = walletRepositoryBlockchain.findByAddress("address");
		wallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryBlockchain.index(wallet);

		assert.true(walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
		assert.true(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
	});

	it("should return true if wallet exist in clone wallet repository", () => {
		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryClone.index(wallet);

		assert.false(walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
		assert.true(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
	});

	it("should return false if wallet does not exist in clone wallet repository", () => {
		assert.false(walletRepositoryBlockchain.hasByAddress("address"));
		assert.false(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
	});

	it("should return false if index is forgotten", () => {
		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryClone.index(wallet);

		assert.true(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));

		wallet.forgetAttribute("delegate");
		walletRepositoryClone.index(wallet);

		assert.false(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
	});

	it("should return false if index is forgotten bu forgetOnIndex method", () => {
		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryClone.index(wallet);

		assert.true(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));

		walletRepositoryClone.forgetOnIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1");

		assert.false(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
	});

	it("should return false if index is forgotten, but still exist on blockchain wallet repository", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
		blockchainWallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryBlockchain.index(blockchainWallet);

		const wallet = walletRepositoryClone.findByAddress("address");
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("genesis_1"));
		assert.true(wallet.hasAttribute("delegate.username"));

		assert.true(walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
		assert.true(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));

		wallet.forgetAttribute("delegate");
		walletRepositoryClone.index(wallet);

		assert.true(walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
		assert.true(
			// @ts-ignore
			walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].has("genesis_1")
		);
		assert.false(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
	});

	it("should return false if index is forgotten and set again and still exist on blockchain wallet repository", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
		blockchainWallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryBlockchain.index(blockchainWallet);

		const wallet = walletRepositoryClone.findByAddress("address");

		assert.true(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));

		wallet.forgetAttribute("delegate");
		walletRepositoryClone.index(wallet);

		assert.false(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));

		// Set same index again
		wallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryClone.index(wallet);

		assert.true(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"));
	});
});

describe("getNonce", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	const publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

	it("should return 0 if wallet does not exists", () => {
		assert.equal(walletRepositoryClone.getNonce(publicKey), Utils.BigNumber.ZERO);
	});

	it("should return nonce if wallet exists only in blockchain wallet repository", () => {
		const wallet = walletRepositoryBlockchain.findByPublicKey(publicKey);
		wallet.setNonce(Utils.BigNumber.make("10"));

		assert.equal(walletRepositoryClone.getNonce(publicKey), Utils.BigNumber.make("10"));
		assert.true(
			walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey),
		);
		assert.false(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey));
	});

	it("should return nonce if wallet exists on copy wallet repository", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByPublicKey(publicKey);
		blockchainWallet.setNonce(Utils.BigNumber.make("10"));

		const wallet = walletRepositoryClone.findByPublicKey(publicKey);
		wallet.setNonce(Utils.BigNumber.make("20"));

		assert.equal(walletRepositoryClone.getNonce(publicKey), Utils.BigNumber.make("20"));
		assert.true(
			walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey),
		);
		assert.true(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey));
	});
});

describe("allByAddress", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should return all wallets from clone and blockchain wallet repository by address", () => {
		assert.equal(walletRepositoryClone.allByAddress().length, 0);

		walletRepositoryClone.findByAddress("address_1");
		assert.equal(walletRepositoryClone.allByAddress().length, 1);

		walletRepositoryBlockchain.findByAddress("address_2");
		assert.equal(walletRepositoryClone.allByAddress().length, 2);
	});
});

describe("allByPublicKey", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should return all wallets from clone and blockchain wallet repository by public key", () => {
		assert.equal(walletRepositoryClone.allByPublicKey().length, 0);

		walletRepositoryClone.findByPublicKey("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");
		assert.equal(walletRepositoryClone.allByPublicKey().length, 1);

		walletRepositoryBlockchain.findByPublicKey(
			"02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
		);
		assert.equal(walletRepositoryClone.allByPublicKey().length, 2);

		walletRepositoryClone.findByAddress("address_1");
		walletRepositoryBlockchain.findByAddress("address_2");

		assert.equal(walletRepositoryClone.allByPublicKey().length, 2);
	});
});

describe("allByUsername", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should return all wallets from clone and blockchain wallet repository by username", () => {
		assert.equal(walletRepositoryClone.allByUsername().length, 0);

		const wallet_1 = walletRepositoryClone.findByAddress("address_1");
		wallet_1.setAttribute("delegate.username", "genesis_1");
		walletRepositoryClone.index(wallet_1);
		assert.equal(walletRepositoryClone.allByUsername().length, 1);

		const wallet_2 = walletRepositoryBlockchain.findByAddress("address_2");
		wallet_2.setAttribute("delegate.username", "genesis_2");
		walletRepositoryBlockchain.index(wallet_2);

		assert.equal(walletRepositoryClone.allByUsername().length, 2);
	});

	it("should skip wallets when key is removed from index", () => {
		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryClone.index(wallet);

		assert.equal(walletRepositoryClone.allByUsername().length, 1);

		wallet.forgetAttribute("delegate");
		walletRepositoryClone.index(wallet);

		assert.equal(walletRepositoryClone.allByUsername().length, 0);
	});

	it("should skip wallets when key is removed from index, but still exists on blockchain index", () => {
		const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
		blockchainWallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryBlockchain.index(blockchainWallet);

		assert.equal(walletRepositoryClone.allByUsername().length, 1);

		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.forgetAttribute("delegate");
		walletRepositoryClone.index(wallet);

		assert.equal(walletRepositoryClone.allByUsername().length, 0);
		assert.equal(walletRepositoryBlockchain.allByUsername().length, 1);
	});
});

describe("allByIndex", ({ it, skip, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	skip("should return all wallets from clone and blockchain wallet repository by address", () => {
		assert.equal(walletRepositoryClone.allByIndex(Contracts.State.WalletIndexes.Usernames).length, 0);

		const wallet1 = walletRepositoryClone.findByAddress("address_1");
		walletRepositoryClone.setOnIndex(Contracts.State.WalletIndexes.Usernames, "usernames_1", wallet1);

		assert.equal(walletRepositoryClone.allByIndex(Contracts.State.WalletIndexes.Usernames), [wallet1]);

		const wallet2 = walletRepositoryBlockchain.findByAddress("address_2");
		walletRepositoryBlockchain.setOnIndex(Contracts.State.WalletIndexes.Usernames, "usernames_2", wallet2);

		assert.equal(walletRepositoryClone.allByIndex(Contracts.State.WalletIndexes.Usernames), [
			wallet1,
			wallet2,
		]);
	});
});

describe("reset", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should clear all indexes and forgetIndexes", () => {
		const wallet = walletRepositoryClone.findByAddress("address");
		wallet.setAttribute("delegate.username", "genesis_1");
		walletRepositoryClone.index(wallet);

		wallet.forgetAttribute("delegate");
		walletRepositoryClone.index(wallet);

		assert.equal(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).values().length, 1);
		// @ts-ignore
		assert.equal(walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].values().length, 1);

		walletRepositoryClone.reset();

		assert.equal(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).values().length, 0);
		// @ts-ignore
		assert.equal(walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].values().length, 0);
	});
});

describe("getForgetIndex", ({ it, assert, beforeEach }) => {
	beforeEach(beforeEachCallback);

	it("should throw error if index is not found", () => {
		assert.throws(() => {
			// @ts-ignore
			walletRepositoryClone.getForgetIndex("undefined");
		});
	});
});
