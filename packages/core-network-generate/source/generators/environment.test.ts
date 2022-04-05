import { existsSync, readFileSync } from "fs-extra";
import { join } from "path";
import { dirSync, setGracefulCleanup } from "tmp";

import { describe } from "../../../core-test-framework/distribution";
import { EnvironmentGenerator } from "./environment";

describe<{
	dataPath: string;
	generator: EnvironmentGenerator;
}>("App generator", ({ it, assert, beforeEach, beforeAll }) => {
	beforeAll(() => {
		setGracefulCleanup();
	});

	beforeEach((context) => {
		context.dataPath = dirSync().name;
		context.generator = new EnvironmentGenerator();
	});

	it("#get - should return generated data", ({ generator }) => {
		assert.object(generator.get());
	});

	it("#generate - should append records", ({ generator }) => {
		assert.undefined(generator.get().TEST);

		assert.equal(generator.generate({ TEST: "test" }).get().TEST, "test");
	});

	it("#write - should write generated data", ({ generator, dataPath }) => {
		assert.false(existsSync(join(dataPath, ".env")));

		generator.write(dataPath);

		assert.true(existsSync(join(dataPath, ".env")));

		const content = readFileSync(join(dataPath, ".env")).toString();

		assert.true(content.includes("CORE_DB_HOST=localhost"));
		assert.true(content.includes("CORE_DB_PORT=5432"));
		assert.true(content.includes("CORE_LOG_LEVEL=info"));
		assert.true(content.includes("CORE_LOG_LEVEL_FILE=info"));
		assert.true(content.includes("CORE_P2P_HOST=0.0.0.0"));
		assert.true(content.includes("CORE_P2P_PORT=4000"));
		assert.true(content.includes("CORE_WEBHOOKS_HOST=0.0.0.0"));
		assert.true(content.includes("CORE_WEBHOOKS_PORT=4004"));
	});
});
