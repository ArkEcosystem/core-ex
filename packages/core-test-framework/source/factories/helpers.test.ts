import cryptoConfig from "../../../core/bin/config/testnet/crypto.json";
import { describe, Sandbox } from "../index";
import { factory } from "./helpers";

describe<{
	sandbox: Sandbox;
}>("Helpers", ({ it, assert }) => {
	it("should register all factories", async ({ sandbox }) => {
		assert.defined(await factory("Block", cryptoConfig));
		assert.defined(await factory("Identity", cryptoConfig));
		assert.defined(await factory("Peer", cryptoConfig));
		assert.defined(await factory("Round", cryptoConfig));
		assert.defined(await factory("Transfer", cryptoConfig));
		assert.defined(await factory("ValidatorRegistration", cryptoConfig));
		assert.defined(await factory("ValidatorResignation", cryptoConfig));
		assert.defined(await factory("Vote", cryptoConfig));
		assert.defined(await factory("Unvote", cryptoConfig));
		assert.defined(await factory("MultiSignature", cryptoConfig));
		assert.defined(await factory("MultiPayment", cryptoConfig));
		assert.defined(await factory("Wallet", cryptoConfig));
	});
});
