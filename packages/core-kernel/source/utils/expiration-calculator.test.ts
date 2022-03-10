import { describe } from "../../../core-test-framework";

import { calculateTransactionExpiration } from "./expiration-calculator";

const context = {
	blockTime: 8,
	currentHeight: 100,
	now: 2000,
	maxTransactionAge: 500,
};

describe("Calculate Transaction Expiration", ({ assert, it }) => {
	it("should use the transaction expiration if the transaction version is 2", () => {
		assert.is(
			calculateTransactionExpiration(
				// @ts-ignore
				{
					version: 2,
					expiration: 100,
				},
				context,
			),
			100,
		);
	});

	it("should return undefined if the transaction version is 2 and no expiration is set", () => {
		assert.undefined(
			calculateTransactionExpiration(
				// @ts-ignore
				{
					version: 2,
				},
				context,
			),
		);
	});

	it("should calculate the expiration if the transaction version is 1", () => {
		assert.is(
			calculateTransactionExpiration(
				// @ts-ignore
				{
					timestamp: 1000,
				},
				context,
			),
			475,
		);
	});
});
