import { Identifiers } from "@arkecosystem/core-contracts";
import { describe, Sandbox } from "@arkecosystem/core-test-framework";
import { BigNumber } from "@arkecosystem/utils";

import { VoteTransactionHandler } from "./handlers";
import { ServiceProvider } from "./index";
import { VoteTransaction } from "./versions/1";

describe<{
	sandbox: Sandbox;
	feeRegistry: any;
	transactionRegistry: any;
}>("Index", ({ beforeEach, it, assert, stub }) => {
	beforeEach((context) => {
		context.feeRegistry = {
			set: () => {},
		};

		context.transactionRegistry = {
			registerTransactionType: () => {},
		};

		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.Fee.Registry).toConstantValue(context.feeRegistry);
		context.sandbox.app
			.bind(Identifiers.Cryptography.Transaction.Registry)
			.toConstantValue(context.transactionRegistry);
	});

	it("should register fees with managed fee type", async ({ sandbox, feeRegistry, transactionRegistry }) => {
		const spySetFee = stub(feeRegistry, "set");
		stub(transactionRegistry, "registerTransactionType");
		sandbox.app.bind(Identifiers.Fee.Type).toConstantValue("managed");

		const serviceProvider = sandbox.app.resolve(ServiceProvider);

		await serviceProvider.register();

		spySetFee.calledOnce();
		spySetFee.calledWith(VoteTransaction.key, VoteTransaction.version, BigNumber.make("100"));
	});

	it("should register fees with static fee type", async ({ sandbox, feeRegistry, transactionRegistry }) => {
		const spySetFee = stub(feeRegistry, "set");
		stub(transactionRegistry, "registerTransactionType");
		sandbox.app.bind(Identifiers.Fee.Type).toConstantValue("static");

		const serviceProvider = sandbox.app.resolve(ServiceProvider);

		await serviceProvider.register();

		spySetFee.calledOnce();
		spySetFee.calledWith(VoteTransaction.key, VoteTransaction.version, BigNumber.make("100000000"));
	});

	it("should register type and handler", async ({ sandbox, feeRegistry, transactionRegistry }) => {
		const spySetFee = stub(feeRegistry, "set");
		const spyRegisterTransactionType = stub(transactionRegistry, "registerTransactionType");
		sandbox.app.bind(Identifiers.Fee.Type).toConstantValue("static");

		const serviceProvider = sandbox.app.resolve(ServiceProvider);

		await serviceProvider.register();

		spySetFee.calledOnce();
		spyRegisterTransactionType.calledOnce();
		spyRegisterTransactionType.calledWith(VoteTransaction);

		const types = [
			...sandbox.app.container["_bindingDictionary"].getMap().get(Identifiers.TransactionHandler).values(),
		].map((binding) => binding.implementationType);

		assert.equal(types.length, 1);
		assert.equal(types[0], VoteTransactionHandler);
	});
});
