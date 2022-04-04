import { readFileSync, readJSONSync } from "fs-extra";

import { sandboxOptions } from "../../../test/assets/sanbox-options";
import { describe } from "../../index";
import passphrases from "../../internal/passphrases.json";
import { CoreConfigPaths } from "../contracts";
import { CoreGenerator } from "./core";

describe("CoreGenerator", ({ it, assert }) => {
	it("should generate core config paths", async () => {
		const generator: CoreGenerator = new CoreGenerator();

		const result: CoreConfigPaths = generator.generate();

		assert.string(result.root);
		assert.true(result.env.includes(".env"));
		assert.true(result.app.includes("app.json"));
		assert.true(result.validators.includes("validators.json"));
		assert.true(result.peers.includes("peers.json"));
	});

	it("should generate core config paths with options", async () => {
		const generator: CoreGenerator = new CoreGenerator(sandboxOptions);

		const result: CoreConfigPaths = generator.generate();

		assert.string(result.root);
		assert.true(result.env.includes(".env"));
		assert.true(result.app.includes("app.json"));
		assert.true(result.validators.includes("validators.json"));
		assert.true(result.peers.includes("peers.json"));

		assert.equal(readFileSync(result.env).toString(), "TEST=test\n");
		assert.equal(readJSONSync(result.app), {});
		assert.equal(readJSONSync(result.validators), { secrets: passphrases });
		assert.equal(readJSONSync(result.peers), {});
	});
});
