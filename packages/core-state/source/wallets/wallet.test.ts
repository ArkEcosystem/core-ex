import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { Services } from "@arkecosystem/core-kernel";
import { Wallet, WalletEvent } from "../wallets";
import { getWalletAttributeSet } from "@arkecosystem/core-test-framework/source/internal/wallet-attributes";
import { Setup, setUp } from "../../test/setup";
import { describe } from "@arkecosystem/core-test-framework";

let setup: Setup;

describe("Models - Wallet", ({ it, assert, beforeAll, beforeEach }) => {
	let attributeMap;

	beforeAll(async () => {
		setup = await setUp();
	});

	beforeEach(() => {
		attributeMap = new Services.Attributes.AttributeMap(getWalletAttributeSet());
	});

	it("returns the address", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.equal(wallet.getAddress(), address);
	});

	it("should set and get publicKey", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.undefined(wallet.getPublicKey());

		wallet.setPublicKey("publicKey");
		assert.equal(wallet.getPublicKey(), "publicKey");
	});

	it("should set and get balance", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.equal(wallet.getBalance(), Utils.BigNumber.ZERO);

		wallet.setBalance(Utils.BigNumber.ONE);
		assert.equal(wallet.getBalance(), Utils.BigNumber.ONE);
	});

	it("should set and get nonce", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.equal(wallet.getNonce(), Utils.BigNumber.ZERO);

		wallet.setNonce(Utils.BigNumber.ONE);
		assert.equal(wallet.getNonce(), Utils.BigNumber.ONE);
	});

	it("should increase balance", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.equal(wallet.getBalance(), Utils.BigNumber.ZERO);

		assert.equal(wallet.increaseBalance(Utils.BigNumber.ONE), wallet);
		assert.equal(wallet.getBalance(), Utils.BigNumber.ONE);
	});

	it("should decrease balance", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.equal(wallet.getBalance(), Utils.BigNumber.ZERO);
		assert.equal(wallet.decreaseBalance(Utils.BigNumber.ONE), wallet);
		assert.equal(wallet.getBalance(), Utils.BigNumber.make("-1"));
	});

	it("should increase nonce", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.equal(wallet.getNonce(), Utils.BigNumber.ZERO);

		wallet.increaseNonce();

		assert.equal(wallet.getNonce(), Utils.BigNumber.ONE);
	});

	it("should decrease nonce", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.equal(wallet.getNonce(), Utils.BigNumber.ZERO);

		wallet.decreaseNonce();
		assert.equal(wallet.getNonce(), Utils.BigNumber.make("-1"));
	});

	it("should get, set and forget custom attributes", () => {
		const customAttributeSet = getWalletAttributeSet();
		customAttributeSet.set("customAttribute");
		const custromAttributeMap = new Services.Attributes.AttributeMap(customAttributeSet);

		const address = "Abcde";
		const wallet = new Wallet(address, custromAttributeMap);
		const testAttribute = { test: true };
		wallet.setAttribute("customAttribute", testAttribute);

		assert.true(wallet.hasAttribute("customAttribute"));
		assert.equal(wallet.getAttribute("customAttribute"), testAttribute);

		wallet.forgetAttribute("customAttribute");

		assert.false(wallet.hasAttribute("customAttribute"));

		customAttributeSet.forget("customAttribute");

		assert.throws(() => wallet.hasAttribute("customAttribute"));
		assert.throws(() => wallet.getAttribute("customAttribute"));
	});

	it("should get all attributes", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		wallet.setAttribute("delegate", {});
		wallet.setAttribute("vote", {});

		assert.equal(wallet.getAttributes(), { delegate: {}, vote: {} });
	});

	it("should return whether wallet is delegate", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.false(wallet.isDelegate());
		wallet.setAttribute("delegate", {});
		assert.true(wallet.isDelegate());
	});

	it("should return whether wallet has voted", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.false(wallet.hasVoted());
		wallet.setAttribute("vote", {});
		assert.true(wallet.hasVoted());
	});

	it("should return whether the wallet has multisignature", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);

		assert.false(wallet.hasMultiSignature());
		wallet.setAttribute("multiSignature", {});
		assert.true(wallet.hasMultiSignature());
	});

	it("should be cloneable", () => {
		const address = "Abcde";
		const wallet = new Wallet(address, attributeMap);
		wallet.setPublicKey("test");

		assert.equal(wallet.clone(), wallet);
	});
});

describe("Original", ({ it, beforeAll, beforeEach, assert, afterEach }) => {
	let wallet: Wallet;

	beforeAll(async () => {
		setup = await setUp();
	});

	beforeEach(() => {
		const attributeMap = new Services.Attributes.AttributeMap(getWalletAttributeSet());
		const events = setup.sandbox.app.get<Contracts.Kernel.EventDispatcher>(
			Container.Identifiers.EventDispatcherService,
		);

		wallet = new Wallet("Abcde", attributeMap, events);
	});

	afterEach(() => {
		setup.spies.dispatchSyncSpy.resetHistory();
	});

	it("should emit on setPublicKey", async () => {
		wallet.setPublicKey("dummyPublicKey");

		assert.true(setup.spies.dispatchSyncSpy.calledOnce);

		assert.true(
			setup.spies.dispatchSyncSpy.calledWith(WalletEvent.PropertySet, {
				publicKey: "dummyPublicKey",
				key: "publicKey",
				previousValue: undefined,
				value: "dummyPublicKey",
				wallet,
			}),
		);
	});

	it("should emit on setBalance", async () => {
		wallet.setBalance(Utils.BigNumber.ONE);

		assert.true(setup.spies.dispatchSyncSpy.calledOnce);
		assert.true(
			setup.spies.dispatchSyncSpy.calledWith(WalletEvent.PropertySet, {
				publicKey: undefined,
				key: "balance",
				previousValue: Utils.BigNumber.ZERO,
				value: Utils.BigNumber.ONE,
				wallet,
			}),
		);
	});

	it("should emit on increaseBalance", async () => {
		wallet.increaseBalance(Utils.BigNumber.ONE);

		assert.true(setup.spies.dispatchSyncSpy.calledOnce);
		assert.true(
			setup.spies.dispatchSyncSpy.calledWith(WalletEvent.PropertySet, {
				publicKey: undefined,
				key: "balance",
				previousValue: Utils.BigNumber.ZERO,
				value: Utils.BigNumber.ONE,
				wallet,
			}),
		);
	});

	it("should emit on decreaseBalance", async () => {
		wallet.decreaseBalance(Utils.BigNumber.ONE);

		assert.true(setup.spies.dispatchSyncSpy.calledOnce);
		assert.true(
			setup.spies.dispatchSyncSpy.calledWith(WalletEvent.PropertySet, {
				publicKey: undefined,
				key: "balance",
				previousValue: Utils.BigNumber.ZERO,
				value: Utils.BigNumber.make("-1"),
				wallet,
			}),
		);
	});

	it("should emit on setNonce", async () => {
		wallet.setNonce(Utils.BigNumber.ONE);

		assert.true(setup.spies.dispatchSyncSpy.calledOnce);
		assert.true(
			setup.spies.dispatchSyncSpy.calledWith(WalletEvent.PropertySet, {
				publicKey: undefined,
				key: "nonce",
				previousValue: Utils.BigNumber.ZERO,
				value: Utils.BigNumber.ONE,
				wallet,
			}),
		);
	});

	it("should emit on increaseNonce", async () => {
		wallet.increaseNonce();

		assert.true(setup.spies.dispatchSyncSpy.calledOnce);
		assert.true(
			setup.spies.dispatchSyncSpy.calledWith(WalletEvent.PropertySet, {
				publicKey: undefined,
				key: "nonce",
				previousValue: Utils.BigNumber.ZERO,
				value: Utils.BigNumber.ONE,
				wallet,
			}),
		);
	});

	it("should emit on decreaseNonce", async () => {
		wallet.decreaseNonce();

		assert.true(setup.spies.dispatchSyncSpy.calledOnce);
		assert.true(
			setup.spies.dispatchSyncSpy.calledWith(WalletEvent.PropertySet, {
				publicKey: undefined,
				key: "nonce",
				previousValue: Utils.BigNumber.ZERO,
				value: Utils.BigNumber.make("-1"),
				wallet,
			}),
		);
	});

	it("should emit on setAttribute", async () => {
		wallet.setAttribute("delegate.username", "dummy");

		assert.true(setup.spies.dispatchSyncSpy.calledOnce);
		assert.true(
			setup.spies.dispatchSyncSpy.calledWith(WalletEvent.PropertySet, {
				publicKey: undefined,
				key: "delegate.username",
				value: "dummy",
				wallet,
			}),
		);
	});

	it("should emit on forgetAttribute", async () => {
		wallet.setAttribute("delegate.username", "dummy");
		wallet.forgetAttribute("delegate.username");

		assert.true(setup.spies.dispatchSyncSpy.calledTwice);
		assert.true(
			setup.spies.dispatchSyncSpy.calledWith(WalletEvent.PropertySet, {
				publicKey: undefined,
				key: "delegate.username",
				previousValue: "dummy",
				wallet,
			}),
		);
	});

	it("should clone", async () => {
		wallet.setAttribute("delegate.username", "dummy");
		const clone = wallet.clone();

		assert.equal(clone.getAddress(), "Abcde");
		assert.equal(clone.getAttribute("delegate.username"), "dummy");
	});
});

describe("Clone", ({ it, beforeAll, beforeEach, assert }) => {
	let clone;

	beforeAll(async () => {
		setup = await setUp();
	});

	beforeEach(() => {
		const attributeMap = new Services.Attributes.AttributeMap(getWalletAttributeSet());
		const events = setup.sandbox.app.get<Contracts.Kernel.EventDispatcher>(
			Container.Identifiers.EventDispatcherService,
		);
		const wallet = new Wallet("Abcde", attributeMap, events);
		clone = wallet.clone();
	});

	it("should emit on property set", async () => {
		clone.nonce = Utils.BigNumber.make("3");

		assert.false(setup.spies.dispatchSyncSpy.called);
	});

	it("should emit on setAttribute", async () => {
		clone.setAttribute("delegate.username", "dummy");

		assert.false(setup.spies.dispatchSyncSpy.called);
	});

	it("should emit on forgetAttribute", async () => {
		clone.setAttribute("delegate.username", "dummy");
		clone.forgetAttribute("delegate.username");

		assert.false(setup.spies.dispatchSyncSpy.called);
	});
});
