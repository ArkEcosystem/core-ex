import Ajv from "ajv";

import { describe, Sandbox } from "../../core-test-framework";
import { Validator } from "./validator";

describe<{
	validator: Validator;
}>("Validator", ({ beforeEach, it, assert }) => {
	beforeEach((context) => {
		const sandbox = new Sandbox();

		context.validator = sandbox.app.resolve(Validator);
	});

	it("#validate - should passs", async ({ validator }) => {
		validator.addSchema({
			$id: "test",
			type: "string",
		});

		const result = await validator.validate("test", "value");

		assert.equal(result.value, "value");
		assert.undefined(result.error);
		assert.undefined(result.errors);
	});

	it("#validate - should not passs", async ({ validator }) => {
		validator.addSchema({
			$id: "test",
			type: "string",
		});

		const result = await validator.validate("test", 123);

		assert.equal(result.value, 123);
		assert.equal(result.error, "data must be string");
		assert.array(result.errors);
		assert.length(result.errors, 1);
	});

	it("#addFormat - should add format", async ({ validator }) => {
		validator.addFormat("testFormat", {
			type: "number",
			validate: (data) => data === 1,
		});

		validator.addSchema({
			$id: "test",
			format: "testFormat",
		});

		assert.undefined((await validator.validate("test", 1)).error);
		assert.defined((await validator.validate("test", 2)).error);
	});

	it("#addKeyword - should add keyword", async ({ validator }) => {
		validator.addKeyword({
			compile() {
				return (data) => data === 1;
			},
			keyword: "testKeyword",
		});

		validator.addSchema({
			$id: "test",
			testKeyword: false,
		});

		assert.undefined((await validator.validate("test", 1)).error);
		assert.defined((await validator.validate("test", 2)).error);
	});

	it("#removeKeywork - should remove kayword", async ({ validator }) => {
		validator.addKeyword({
			compile() {
				return (data) => data === 1;
			},
			keyword: "testKeyword",
		});

		validator.addSchema({
			$id: "test",
			testKeyword: false,
		});

		assert.undefined((await validator.validate("test", 1)).error);
		assert.defined((await validator.validate("test", 2)).error);

		validator.removeKeyword("testKeyword");

		validator.addSchema({
			$id: "test2",
			testKeyword: false,
		});

		assert.defined((await validator.validate("test2", 1)).error);
		assert.defined((await validator.validate("test2", 2)).error); // No error
	});

	it("#addSchema - should add schema", async ({ validator }) => {
		validator.addSchema({
			$id: "test",
			type: "string",
		});

		assert.undefined((await validator.validate("test", "1")).error);
		assert.defined((await validator.validate("test", 1)).error);
	});

	it("#addSchema - should remove schema", async ({ validator }) => {
		validator.addSchema({
			$id: "test",
			type: "string",
		});

		assert.undefined((await validator.validate("test", "1")).error);
		assert.defined((await validator.validate("test", 1)).error);

		validator.removeSchema("test");

		assert.true((await validator.validate("test", "1")).error.includes('Error: no schema with key or ref "test"'));
	});

	it("#extend - should pass ajv instance in callback", ({ validator }) => {
		let ajv;

		validator.extend((item) => {
			ajv = item;
		});

		assert.instance(ajv, Ajv);
	});
});
