import { Contracts, Exceptions, Identifiers } from "@arkecosystem/core-contracts";
import { ValidatorRegistrationTransactionHandler } from "@arkecosystem/core-crypto-transaction-validator-registration";
import { describe, Sandbox } from "@arkecosystem/core-test-framework";

import { VoteTransaction } from "../versions";
import { VoteTransactionHandler } from "./index";

describe<{
	sandbox: Sandbox;
	walletRepository: any;
	handler: VoteTransactionHandler;
}>("VoteHandler", ({ beforeEach, it, assert, stub }) => {
	const wallet = {
		forgetAttribute: () => {},
		getAttribute: () => {},
		hasAttribute: () => {},
		setAttribute: () => {},
	};

	let spyForgetAttribute;
	let spyGetAttribute;
	let spyHasAttribute;
	let spySetAttribute;

	const getTransaction = (votes: string[]): Partial<Contracts.Crypto.ITransaction> => {
		const transactionData: Partial<Contracts.Crypto.ITransactionData> = {
			asset: {
				votes: votes,
			},
			senderPublicKey: "senderPublicKey",
			type: VoteTransaction.type,
			typeGroup: VoteTransaction.typeGroup,
		};

		return {
			data: transactionData as Contracts.Crypto.ITransactionData,
		};
	};

	beforeEach((context) => {
		context.walletRepository = {
			findByPublicKey: () => {},
		};

		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.WalletRepository).toConstantValue(context.walletRepository);
		context.sandbox.app.bind(Identifiers.LogService).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Transaction.Verifier).toConstantValue({});
		context.sandbox.app.bind(Identifiers.TransactionPoolQuery).toConstantValue({});

		context.handler = context.sandbox.app.resolve(VoteTransactionHandler);

		spyHasAttribute = stub(wallet, "hasAttribute");
		spyGetAttribute = stub(wallet, "getAttribute");
		spySetAttribute = stub(wallet, "setAttribute");
		spyForgetAttribute = stub(wallet, "forgetAttribute");

		stub(context.walletRepository, "findByPublicKey").resolvedValue(wallet);
	});

	it("#dependencies -  shoudl depend on ValidatorRegistrationTransaction", ({ handler }) => {
		assert.equal(handler.dependencies(), [ValidatorRegistrationTransactionHandler]);
	});

	it("#walletAttributes -  shoudl return vote", ({ handler }) => {
		assert.equal(handler.walletAttributes(), ["vote"]);
	});

	it("#getConstructor -  shoudl return VoteTransaction", ({ handler }) => {
		assert.equal(handler.getConstructor(), VoteTransaction);
	});

	it("#isActivated -  shoudl return true", async ({ handler }) => {
		assert.true(await handler.isActivated());
	});

	it("#bootstrap -  shoudl set wallet vote attribute", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(false);

		const transactions = [getTransaction(["+validatorPublicKey"])];

		await assert.resolves(() => handler.bootstrap(transactions as Contracts.Crypto.ITransaction[]));

		spyHasAttribute.calledOnce();
		spyHasAttribute.calledWith("vote");
		spySetAttribute.calledOnce();
		spySetAttribute.calledWith("vote", "validatorPublicKey");
		spyForgetAttribute.neverCalled();
	});

	it("#bootstrap -  shoudl throw if wallet already voted", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(true);

		const transactions = [getTransaction(["+validatorPublicKey"])];

		await assert.rejects(
			() => handler.bootstrap(transactions as Contracts.Crypto.ITransaction[]),
			Exceptions.AlreadyVotedError,
		);

		spyHasAttribute.calledOnce();
		spyHasAttribute.calledWith("vote");

		spyGetAttribute.neverCalled();
		spySetAttribute.neverCalled();
		spyForgetAttribute.neverCalled();
	});

	it("#bootstrap -  shoudl forget wallet vote attribute", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(true);
		spyGetAttribute.returnValue("validatorPublicKey");

		const transactions = [getTransaction(["-validatorPublicKey"])];

		await assert.resolves(() => handler.bootstrap(transactions as Contracts.Crypto.ITransaction[]));

		spyHasAttribute.calledOnce();
		spyHasAttribute.calledWith("vote");
		spyGetAttribute.calledOnce();
		spyGetAttribute.calledWith("vote");
		spyForgetAttribute.calledOnce();
		spyForgetAttribute.calledWith("vote");

		spySetAttribute.neverCalled();
	});

	it("#bootstrap -  shoudl throw if walled didn't vote", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(false);
		spyGetAttribute.returnValue("validatorPublicKey");

		const transactions = [getTransaction(["-validatorPublicKey"])];

		await assert.rejects(
			() => handler.bootstrap(transactions as Contracts.Crypto.ITransaction[]),
			Exceptions.NoVoteError,
		);

		spyHasAttribute.calledOnce();
		spyHasAttribute.calledWith("vote");

		spyGetAttribute.neverCalled();
		spyForgetAttribute.neverCalled();
		spySetAttribute.neverCalled();
	});

	it("#bootstrap -  shoudl throw on vote missmatch", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(true);
		spyGetAttribute.returnValue("invalidPublicKey");

		const transactions = [getTransaction(["-validatorPublicKey"])];

		await assert.rejects(
			() => handler.bootstrap(transactions as Contracts.Crypto.ITransaction[]),
			Exceptions.UnvoteMismatchError,
		);

		spyHasAttribute.calledOnce();
		spyHasAttribute.calledWith("vote");
		spyGetAttribute.calledOnce();
		spyHasAttribute.calledWith("vote");

		spyForgetAttribute.neverCalled();
		spySetAttribute.neverCalled();
	});
});
