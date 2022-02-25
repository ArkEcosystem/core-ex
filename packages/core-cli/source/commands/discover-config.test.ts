import { join } from "path";
import { Console, describe } from "@arkecosystem/core-test-framework";
import envPaths from "env-paths";
import { ensureDirSync, writeJSON } from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";

import { DiscoverConfig } from "./discover-config";

describe<{
	cmd: DiscoverConfig;
}>("DiscoverConfig", ({ beforeEach, afterAll, it, assert, stub }) => {
	let configPath;
	const config = { network: "testnet", token: "token" };

	beforeEach((context) => {
		const cli = new Console();

		context.cmd = cli.app.resolve(DiscoverConfig);

		configPath = join(dirSync().name, "token-core");
	});

	afterAll(() => setGracefulCleanup());

	it("should return undefined if configuration can't be found", async ({ cmd }) => {
		assert.undefined(await cmd.discover());
	});

	// TODO: Check default import
	// it("should return configuration if found on default config location", async ({cmd}) => {
	// 	stub(envPaths, "default").returnValue({
	// 		config: configPath,
	// 	})

	// 	ensureDirSync(join(configPath, "testnet"));

	// 	await writeJSON(join(configPath, "testnet", "config.json"), config);

	// 	assert.equal(await cmd.discover("token", "testnet"), config);
	// });

	it("should return configuration if found on CORE_PATH_CONFIG location", async ({ cmd }) => {
		process.env.CORE_PATH_CONFIG = join(configPath, "testnet");

		ensureDirSync(join(configPath, "testnet"));

		await writeJSON(join(configPath, "testnet", "config.json"), config);

		assert.equal(await cmd.discover(), config);

		delete process.env.CORE_PATH_CONFIG;
	});
});
