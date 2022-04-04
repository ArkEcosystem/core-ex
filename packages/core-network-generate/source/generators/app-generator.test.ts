import { existsSync } from "fs-extra";
import { join } from "path";
import { dirSync, setGracefulCleanup } from "tmp";

import { describe } from "../../../core-test-framework";
import { AppGenerator } from "./app-generator";

describe<{
	dataPath: string;
	appGenerator: AppGenerator;
}>("App generator", ({ it, assert, beforeEach, beforeAll }) => {
	beforeAll(() => {
		setGracefulCleanup();
	});

	beforeEach((context) => {
		context.dataPath = dirSync().name;
		context.appGenerator = new AppGenerator();
	});

	it("#get - should return generated data", ({ appGenerator }) => {
		assert.object(appGenerator.generate().get());
	});

	it("#get - should throw if not generated", ({ appGenerator }) => {
		assert.throws(() => appGenerator.get());
	});

	it("#write - should write generated data", ({ appGenerator, dataPath }) => {
		assert.false(existsSync(join(dataPath, "app.json")));

		appGenerator.generate().write(dataPath);

		assert.true(existsSync(join(dataPath, "app.json")));
	});

	it("#write - should throw if not generated", ({ appGenerator, dataPath }) => {
		assert.throws(() => appGenerator.write(dataPath));
	});
});
