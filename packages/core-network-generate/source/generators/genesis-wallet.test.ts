import { existsSync } from "fs-extra";
import { join } from "path";
import { dirSync, setGracefulCleanup } from "tmp";

import { describe } from "../../../core-test-framework/distribution";
import { buildApp } from "../app-builder";
import { GenesisWalletGenerator } from "./genesis-wallet";

describe<{
	dataPath: string;
	appGenerator: GenesisWalletGenerator;
}>("App generator", ({ it, assert, beforeEach, beforeAll }) => {
	beforeAll(() => {
		setGracefulCleanup();
	});

	beforeEach(async (context) => {
		context.dataPath = dirSync().name;
		context.appGenerator = new GenesisWalletGenerator(await buildApp());
	});

	it("#get - should return generated data", async ({ appGenerator }) => {
		assert.object((await appGenerator.generate()).get());
	});

	it("#get - should throw if not generated", ({ appGenerator }) => {
		assert.throws(() => appGenerator.get());
	});

	it("#write - should write generated data", async ({ appGenerator, dataPath }) => {
		assert.false(existsSync(join(dataPath, "genesis-wallet.json")));

		(await appGenerator.generate()).write(dataPath);

		assert.true(existsSync(join(dataPath, "genesis-wallet.json")));
	});

	it("#write - should throw if not generated", ({ appGenerator, dataPath }) => {
		assert.throws(() => appGenerator.write(dataPath));
	});
});
