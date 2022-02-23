import { Container } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { describe } from "@arkecosystem/core-test-framework";

import { BlockFilter } from "./block-filter";

const container = new Container.Container();

describe("BlockFilter", ({ assert, beforeEach, it }) => {
	it("should return true expression for BlockCriteria.unknown", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ unknown: "123" } as any);

		expect(expression).toEqual({ op: "true" });
	});

	it("should compare using equal expression for BlockCriteria.id", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ id: "123" });

		expect(expression).toEqual({ property: "id", op: "equal", value: "123" });
	});

	it("should compare using equal expression for BlockCriteria.version", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ version: 1 });

		expect(expression).toEqual({ property: "version", op: "equal", value: 1 });
	});

	it("should compare using equal expression for BlockCriteria.timestamp", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ timestamp: 3600 });

		expect(expression).toEqual({ property: "timestamp", op: "equal", value: 3600 });
	});

	it("should compare using between expression for BlockCriteria.timestamp", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ timestamp: { from: 3600, to: 7200 } });

		expect(expression).toEqual({ property: "timestamp", op: "between", from: 3600, to: 7200 });
	});

	it("should compare using greater than equal expression for BlockCriteria.timestamp", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ timestamp: { from: 3600 } });

		expect(expression).toEqual({ property: "timestamp", op: "greaterThanEqual", value: 3600 });
	});

	it("should compare using less than equal expression for BlockCriteria.timestamp", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ timestamp: { to: 3600 } });

		expect(expression).toEqual({ property: "timestamp", op: "lessThanEqual", value: 3600 });
	});

	it("should compare using equal expression for BlockCriteria.previousBlock", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ previousBlock: "456" });

		expect(expression).toEqual({ property: "previousBlock", op: "equal", value: "456" });
	});

	it("should compare using equal expression for BlockCriteria.height", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ height: 100 });

		expect(expression).toEqual({ property: "height", op: "equal", value: 100 });
	});

	it("should compare using between expression for BlockCriteria.height", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ height: { from: 100, to: 200 } });

		expect(expression).toEqual({ property: "height", op: "between", from: 100, to: 200 });
	});

	it("should compare using greater than equal expression for BlockCriteria.height", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ height: { from: 100 } });

		expect(expression).toEqual({ property: "height", op: "greaterThanEqual", value: 100 });
	});

	it("should compare using less than equal expression for BlockCriteria.height", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ height: { to: 100 } });

		expect(expression).toEqual({ property: "height", op: "lessThanEqual", value: 100 });
	});

	it("should compare using equal expression for BlockCriteria.numberOfTransactions", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ numberOfTransactions: 10 });

		expect(expression).toEqual({ property: "numberOfTransactions", op: "equal", value: 10 });
	});

	it("should compare using between expression for BlockCriteria.numberOfTransactions", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ numberOfTransactions: { from: 10, to: 20 } });

		expect(expression).toEqual({ property: "numberOfTransactions", op: "between", from: 10, to: 20 });
	});

	it("should compare using greater than equal expression for BlockCriteria.numberOfTransactions", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ numberOfTransactions: { from: 10 } });

		expect(expression).toEqual({ property: "numberOfTransactions", op: "greaterThanEqual", value: 10 });
	});

	it("should compare using less than equal expression for BlockCriteria.numberOfTransactions", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ numberOfTransactions: { to: 10 } });

		expect(expression).toEqual({ property: "numberOfTransactions", op: "lessThanEqual", value: 10 });
	});

	it("should compare using equal expression for BlockCriteria.totalAmount", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ totalAmount: Utils.BigNumber.make("10000") });

		expect(expression).toEqual({
			property: "totalAmount",
			op: "equal",
			value: Utils.BigNumber.make("10000"),
		});
	});

	it("should compare using between expression for BlockCriteria.totalAmount", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({
			totalAmount: {
				from: Utils.BigNumber.make("10000"),
				to: Utils.BigNumber.make("20000"),
			},
		});

		expect(expression).toEqual({
			property: "totalAmount",
			op: "between",
			from: Utils.BigNumber.make("10000"),
			to: Utils.BigNumber.make("20000"),
		});
	});

	it("should compare using greater than equal expression for BlockCriteria.totalAmount", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({
			totalAmount: {
				from: Utils.BigNumber.make("10000"),
			},
		});

		expect(expression).toEqual({
			property: "totalAmount",
			op: "greaterThanEqual",
			value: Utils.BigNumber.make("10000"),
		});
	});

	it("should compare using less than equal expression for BlockCriteria.totalAmount", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({
			totalAmount: {
				to: Utils.BigNumber.make("10000"),
			},
		});

		expect(expression).toEqual({
			property: "totalAmount",
			op: "lessThanEqual",
			value: Utils.BigNumber.make("10000"),
		});
	});

	it("should compare using equal expression for BlockCriteria.totalFee", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ totalFee: Utils.BigNumber.make("100") });

		expect(expression).toEqual({ property: "totalFee", op: "equal", value: Utils.BigNumber.make("100") });
	});

	it("should compare using between expression for BlockCriteria.totalFee", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({
			totalFee: {
				from: Utils.BigNumber.make("100"),
				to: Utils.BigNumber.make("200"),
			},
		});

		expect(expression).toEqual({
			property: "totalFee",
			op: "between",
			from: Utils.BigNumber.make("100"),
			to: Utils.BigNumber.make("200"),
		});
	});

	it("should compare using greater than equal expression for BlockCriteria.totalFee", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({
			totalFee: {
				from: Utils.BigNumber.make("100"),
			},
		});

		expect(expression).toEqual({
			property: "totalFee",
			op: "greaterThanEqual",
			value: Utils.BigNumber.make("100"),
		});
	});

	it("should compare using less than equal expression for BlockCriteria.totalFee", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({
			totalFee: {
				to: Utils.BigNumber.make("100"),
			},
		});

		expect(expression).toEqual({
			property: "totalFee",
			op: "lessThanEqual",
			value: Utils.BigNumber.make("100"),
		});
	});

	it("should compare using equal expression for BlockCriteria.reward", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ reward: Utils.BigNumber.make("1000") });

		expect(expression).toEqual({ property: "reward", op: "equal", value: Utils.BigNumber.make("1000") });
	});

	it("should compare using between expression for BlockCriteria.reward", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({
			reward: {
				from: Utils.BigNumber.make("1000"),
				to: Utils.BigNumber.make("2000"),
			},
		});

		expect(expression).toEqual({
			property: "reward",
			op: "between",
			from: Utils.BigNumber.make("1000"),
			to: Utils.BigNumber.make("2000"),
		});
	});

	it("should compare using greater than equal expression for BlockCriteria.reward", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({
			reward: {
				from: Utils.BigNumber.make("1000"),
			},
		});

		expect(expression).toEqual({
			property: "reward",
			op: "greaterThanEqual",
			value: Utils.BigNumber.make("1000"),
		});
	});

	it("should compare using less than equal expression for BlockCriteria.reward", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({
			reward: {
				to: Utils.BigNumber.make("1000"),
			},
		});

		expect(expression).toEqual({
			property: "reward",
			op: "lessThanEqual",
			value: Utils.BigNumber.make("1000"),
		});
	});

	it("should compare using equal expression for BlockCriteria.payloadLength", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ payloadLength: 1000 });

		expect(expression).toEqual({ property: "payloadLength", op: "equal", value: 1000 });
	});

	it("should compare using between expression for BlockCriteria.payloadLength", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ payloadLength: { from: 1000, to: 2000 } });

		expect(expression).toEqual({ property: "payloadLength", op: "between", from: 1000, to: 2000 });
	});

	it("should compare using greater than equal expression for BlockCriteria.payloadLength", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ payloadLength: { from: 1000 } });

		expect(expression).toEqual({ property: "payloadLength", op: "greaterThanEqual", value: 1000 });
	});

	it("should compare using less than equal expression for BlockCriteria.payloadLength", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ payloadLength: { to: 1000 } });

		expect(expression).toEqual({ property: "payloadLength", op: "lessThanEqual", value: 1000 });
	});

	it("should compare using equal expression for BlockCriteria.payloadHash", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ payloadHash: "123" });

		expect(expression).toEqual({ property: "payloadHash", op: "equal", value: "123" });
	});

	it("should compare using equal expression for BlockCriteria.generatorPublicKey", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ generatorPublicKey: "123" });

		expect(expression).toEqual({ property: "generatorPublicKey", op: "equal", value: "123" });
	});

	it("should compare using equal expression for BlockCriteria.blockSignature", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({ blockSignature: "123" });

		expect(expression).toEqual({ property: "blockSignature", op: "equal", value: "123" });
	});

	it("should compare using equal expression for BlockCriteria.height and BlockCriteria.generatorPublicKey", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression({
			height: { from: 100 },
			generatorPublicKey: "123",
		});

		expect(expression).toEqual({
			op: "and",
			expressions: [
				{ property: "height", op: "greaterThanEqual", value: 100 },
				{ property: "generatorPublicKey", op: "equal", value: "123" },
			],
		});
	});

	it("should join using or expression (OrBlockCriteria)", async (context) => {
		const blockFilter = container.resolve(BlockFilter);
		const expression = await blockFilter.getExpression([
			{ height: { from: 100 }, generatorPublicKey: "123" },
			{ height: { from: 300 }, generatorPublicKey: "456" },
		]);

		expect(expression).toEqual({
			op: "or",
			expressions: [
				{
					op: "and",
					expressions: [
						{ property: "height", op: "greaterThanEqual", value: 100 },
						{ property: "generatorPublicKey", op: "equal", value: "123" },
					],
				},
				{
					op: "and",
					expressions: [
						{ property: "height", op: "greaterThanEqual", value: 300 },
						{ property: "generatorPublicKey", op: "equal", value: "456" },
					],
				},
			],
		});
	});
});
