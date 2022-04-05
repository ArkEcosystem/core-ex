import { describe } from "../../../core-test-framework/distribution";
import { makeApplication } from "../application-factory";
import { WalletGenerator } from "./wallet";

describe<{
	appGenerator: WalletGenerator;
}>("WalletGenerator", ({ it, assert, beforeEach }) => {
	beforeEach(async (context) => {
		context.appGenerator = new WalletGenerator(await makeApplication());
	});

	it("#generate - should return wallet", async ({ appGenerator }) => {
		const wallet = await appGenerator.generate();

		assert.string(wallet.address);
		assert.string(wallet.passphrase);
		assert.object(wallet.keys);
	});

	it("#generate - should return wallet from mnemonic", async ({ appGenerator }) => {
		const wallet = await appGenerator.generate("mnemonic");

		assert.string(wallet.address);
		assert.equal(wallet.passphrase, "mnemonic");
		assert.object(wallet.keys);
	});
});
