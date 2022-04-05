import { existsSync, readJSONSync } from "fs-extra";
import { join } from "path";
import { dirSync, setGracefulCleanup } from "tmp";

import { describe } from "../../../core-test-framework/distribution";
import { PeersGenerator } from "./peers";

describe<{
	dataPath: string;
	generator: PeersGenerator;
}>("App generator", ({ it, assert, beforeEach, beforeAll }) => {
	beforeAll(() => {
		setGracefulCleanup();
	});

	beforeEach((context) => {
		context.dataPath = dirSync().name;
		context.generator = new PeersGenerator();
	});

	it("#get - should return data", ({ generator }) => {
		assert.equal(generator.get(), ["127.0.0.1"]);
	});

	it("#generate - should set peers", ({ generator }) => {
		assert.equal(generator.generate(["0.0.0.0"]).get(), ["0.0.0.0"]);
	});

	it("#write - should write generated data", ({ generator, dataPath }) => {
		assert.false(existsSync(join(dataPath, "peers.json")));

		generator.write(dataPath);

		assert.equal(readJSONSync(join(dataPath, "peers.json")), { list: ["127.0.0.1"] });
	});
});
