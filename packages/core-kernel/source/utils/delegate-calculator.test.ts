import { Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import { describe, Sandbox } from "../../../core-test-framework";
import { Wallets } from "../../../core-state";

import { calculateApproval, calculateForgedTotal } from "./delegate-calculator";
import { Identifiers } from "../ioc";
import { Attributes } from "../services";

describe<{
	sandbox: Sandbox;
	delegate: Wallets.Wallet;
	config: Interfaces.NetworkConfig;
}>("Delegate Calculator", ({ afterEach, assert, beforeEach, it }) => {
	beforeEach((context) => {
		context.config = Managers.configManager.all();

		context.sandbox = new Sandbox();

		context.sandbox.app
			.bind<Attributes.AttributeSet>(Identifiers.WalletAttributes)
			.to(Attributes.AttributeSet)
			.inSingletonScope();

		context.sandbox.app.get<Attributes.AttributeSet>(Identifiers.WalletAttributes).set("delegate");
		context.sandbox.app.get<Attributes.AttributeSet>(Identifiers.WalletAttributes).set("delegate.voteBalance");

		const walletAttributes = context.sandbox.app.get<Attributes.AttributeSet>(Identifiers.WalletAttributes);
		context.delegate = new Wallets.Wallet(
			"D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7",
			// @ts-ignore
			new Attributes.AttributeMap(walletAttributes),
		);

		Managers.configManager.set("genesisBlock.totalAmount", 1000000 * 1e8);
	});

	afterEach((context) => {
		Managers.configManager.setConfig(context.config);
	});

	it("calculateApproval should calculate correctly with a height", (context) => {
		context.delegate.setAttribute("delegate", {
			producedBlocks: 0,
			voteBalance: Utils.BigNumber.make(10000 * 1e8),
		});

		assert.is(calculateApproval(context.delegate, 1), 1);
	});

	it("calculateApproval should calculate correctly with default height 1", (context) => {
		context.delegate.setAttribute("delegate", {
			producedBlocks: 0,
			voteBalance: Utils.BigNumber.make(10000 * 1e8),
		});

		assert.is(calculateApproval(context.delegate), 1);
	});

	it("calculateApproval should calculate correctly with 2 decimals", (context) => {
		context.delegate.setAttribute("delegate", {
			producedBlocks: 0,
			voteBalance: Utils.BigNumber.make(16500 * 1e8),
		});

		assert.is(calculateApproval(context.delegate, 1), 1.65);
	});

	it("calculateForgedTotal should calculate correctly", (context) => {
		context.delegate.setAttribute("delegate", {
			producedBlocks: 0,
			forgedFees: Utils.BigNumber.make(10),
			forgedRewards: Utils.BigNumber.make(100),
		});

		assert.is(calculateForgedTotal(context.delegate), "110");
	});
});
