import { describe, Sandbox } from "../index";
import { factory } from "./helpers";

describe<{
	sandbox: Sandbox;
}>("Helpers", ({ beforeEach, it, assert }) => {
	beforeEach((context) => {
		context.sandbox = new Sandbox();
	});

	it("should register all factories", async ({ sandbox }) => {
		assert.defined(factory("Block", sandbox.app));
		assert.defined(factory("Identity", sandbox.app));
		assert.defined(factory("Peer", sandbox.app));
		assert.defined(factory("Round", sandbox.app));
		assert.defined(factory("Transfer", sandbox.app));
		assert.defined(factory("ValidatorRegistration", sandbox.app));
		assert.defined(factory("ValidatorResignation", sandbox.app));
		assert.defined(factory("Vote", sandbox.app));
		assert.defined(factory("Unvote", sandbox.app));
		assert.defined(factory("MultiSignature", sandbox.app));
		assert.defined(factory("MultiPayment", sandbox.app));
		assert.defined(factory("Wallet", sandbox.app));
	});
});
