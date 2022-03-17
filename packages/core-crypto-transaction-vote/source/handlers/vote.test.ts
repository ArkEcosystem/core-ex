import { Contracts, Exceptions, Identifiers } from "@arkecosystem/core-contracts";
import { ValidatorRegistrationTransactionHandler } from "@arkecosystem/core-crypto-transaction-validator-registration";
import { Enums as AppEnums } from "@arkecosystem/core-kernel";
import { describe, Sandbox } from "@arkecosystem/core-test-framework";
import { Handlers } from "@arkecosystem/core-transactions";

import { VoteTransaction } from "../versions";
import { VoteTransactionHandler } from "./index";

describe<{
	sandbox: Sandbox;
	walletRepository: any;
	poolQuery: any;
	handler: VoteTransactionHandler;
}>("VoteHandler", ({ beforeEach, it, assert, stub }) => {
	const wallet: Partial<Contracts.State.Wallet> = {
		forgetAttribute: () => false,
		getAttribute: <T>() => "" as unknown as T,
		hasAttribute: () => false,
		setAttribute: () => false,
	};

	const validatorWallet: Partial<Contracts.State.Wallet> = {
		forgetAttribute: () => false,
		getAttribute: <T>() => "" as unknown as T,
		hasAttribute: () => false,
		isValidator: () => false,
		setAttribute: () => false,
	};

	let spyForgetAttribute;
	let spyGetAttribute;
	let spyHasAttribute;
	let spySetAttribute;

	let spyValidatorForgetAttribute;
	let spyValidatorGetAttribute;
	let spyValidatorHasAttribute;
	let spyValidatorSetAttribute;
	let spyValidatorIsValidator;

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

		context.poolQuery = {
			getAllBySender: () => context.poolQuery,
			has: () => false,
			whereKind: () => context.poolQuery,
		};

		context.sandbox = new Sandbox();

		context.sandbox.app.bind(Identifiers.WalletRepository).toConstantValue(context.walletRepository);
		context.sandbox.app.bind(Identifiers.LogService).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Configuration).toConstantValue({});
		context.sandbox.app.bind(Identifiers.Cryptography.Transaction.Verifier).toConstantValue({});
		context.sandbox.app.bind(Identifiers.TransactionPoolQuery).toConstantValue(context.poolQuery);

		context.handler = context.sandbox.app.resolve(VoteTransactionHandler);

		spyHasAttribute = stub(wallet, "hasAttribute");
		spyGetAttribute = stub(wallet, "getAttribute");
		spySetAttribute = stub(wallet, "setAttribute");
		spyForgetAttribute = stub(wallet, "forgetAttribute");

		spyValidatorHasAttribute = stub(validatorWallet, "hasAttribute");
		spyValidatorGetAttribute = stub(validatorWallet, "getAttribute");
		spyValidatorSetAttribute = stub(validatorWallet, "setAttribute");
		spyValidatorForgetAttribute = stub(validatorWallet, "forgetAttribute");
		spyValidatorIsValidator = stub(validatorWallet, "isValidator");
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
		stub(walletRepository, "findByPublicKey").resolvedValue(wallet);

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
		stub(walletRepository, "findByPublicKey").resolvedValue(wallet);

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
		stub(walletRepository, "findByPublicKey").resolvedValue(wallet);

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
		stub(walletRepository, "findByPublicKey").resolvedValue(wallet);

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
		stub(walletRepository, "findByPublicKey").resolvedValue(wallet);

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

	it("throwIfCannotBeApplied - vote should pass", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(false);
		spyValidatorHasAttribute.returnValue(false);
		spyValidatorIsValidator.returnValue(true);
		stub(walletRepository, "findByPublicKey").resolvedValue(validatorWallet);
		const spySuper = stub(Handlers.TransactionHandler.prototype, "throwIfCannotBeApplied");

		await assert.resolves(() =>
			handler.throwIfCannotBeApplied(
				getTransaction(["+validatorPublicKey"]) as Contracts.Crypto.ITransaction,
				wallet as Contracts.State.Wallet,
			),
		);

		spySuper.calledOnce();
		spyHasAttribute.calledWith("vote");
		spyValidatorHasAttribute.calledWith("validator.resigned");
		spyValidatorIsValidator.calledOnce();
	});

	it("throwIfCannotBeApplied - should throw if already voted", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(true);
		spyGetAttribute.returnValue("validatorPublicKey");
		stub(walletRepository, "findByPublicKey").resolvedValue(validatorWallet);
		const spySuper = stub(Handlers.TransactionHandler.prototype, "throwIfCannotBeApplied");

		await assert.rejects(
			() =>
				handler.throwIfCannotBeApplied(
					getTransaction(["+validatorPublicKey"]) as Contracts.Crypto.ITransaction,
					wallet as Contracts.State.Wallet,
				),
			Exceptions.AlreadyVotedError,
		);

		spySuper.neverCalled();
		spyHasAttribute.calledWith("vote");
		spyGetAttribute.calledWith("vote");
	});

	it("throwIfCannotBeApplied - should throw if validator is resigned", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(false);
		spyValidatorHasAttribute.returnValue(true);
		stub(walletRepository, "findByPublicKey").resolvedValue(validatorWallet);
		const spySuper = stub(Handlers.TransactionHandler.prototype, "throwIfCannotBeApplied");

		await assert.rejects(
			() =>
				handler.throwIfCannotBeApplied(
					getTransaction(["+validatorPublicKey"]) as Contracts.Crypto.ITransaction,
					wallet as Contracts.State.Wallet,
				),
			Exceptions.VotedForResignedValidatorError,
		);

		spySuper.neverCalled();
		spyHasAttribute.calledWith("vote");
		spyValidatorHasAttribute.calledWith("validator.resigned");
	});

	it("throwIfCannotBeApplied - should throw if voted is not validator", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(false);
		spyValidatorHasAttribute.returnValue(false);
		spyValidatorIsValidator.returnValue(false);
		stub(walletRepository, "findByPublicKey").resolvedValue(validatorWallet);
		const spySuper = stub(Handlers.TransactionHandler.prototype, "throwIfCannotBeApplied");

		await assert.rejects(
			() =>
				handler.throwIfCannotBeApplied(
					getTransaction(["+validatorPublicKey"]) as Contracts.Crypto.ITransaction,
					wallet as Contracts.State.Wallet,
				),
			Exceptions.VotedForNonValidatorError,
		);

		spySuper.neverCalled();
		spyHasAttribute.calledWith("vote");
		spyValidatorHasAttribute.calledWith("validator.resigned");
		spyValidatorIsValidator.calledOnce();
	});

	it("throwIfCannotBeApplied - unvote should pass", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(true);
		spyGetAttribute.returnValue("validatorPublicKey");
		spyValidatorIsValidator.returnValue(true);
		stub(walletRepository, "findByPublicKey").resolvedValue(validatorWallet);
		const spySuper = stub(Handlers.TransactionHandler.prototype, "throwIfCannotBeApplied");

		await assert.resolves(() =>
			handler.throwIfCannotBeApplied(
				getTransaction(["-validatorPublicKey"]) as Contracts.Crypto.ITransaction,
				wallet as Contracts.State.Wallet,
			),
		);

		spySuper.calledOnce();
		spyHasAttribute.calledWith("vote");
		spyValidatorHasAttribute.neverCalled();
		spyValidatorIsValidator.calledOnce();
	});

	it("throwIfCannotBeApplied - should throw if wallet have no vote", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(false);
		stub(walletRepository, "findByPublicKey").resolvedValue(validatorWallet);
		const spySuper = stub(Handlers.TransactionHandler.prototype, "throwIfCannotBeApplied");

		await assert.rejects(
			() =>
				handler.throwIfCannotBeApplied(
					getTransaction(["-validatorPublicKey"]) as Contracts.Crypto.ITransaction,
					wallet as Contracts.State.Wallet,
				),
			Exceptions.NoVoteError,
		);

		spySuper.neverCalled();
		spyHasAttribute.calledWith("vote");
	});

	it("throwIfCannotBeApplied - should throw on unvote mismatch", async ({ handler, walletRepository }) => {
		spyHasAttribute.returnValue(true);
		spyGetAttribute.returnValue("invalidPublicKey");
		stub(walletRepository, "findByPublicKey").resolvedValue(validatorWallet);
		const spySuper = stub(Handlers.TransactionHandler.prototype, "throwIfCannotBeApplied");

		await assert.rejects(
			() =>
				handler.throwIfCannotBeApplied(
					getTransaction(["-validatorPublicKey"]) as Contracts.Crypto.ITransaction,
					wallet as Contracts.State.Wallet,
				),
			Exceptions.UnvoteMismatchError,
		);

		spySuper.neverCalled();
		spyHasAttribute.calledWith("vote");
		spyGetAttribute.calledWith("vote");
	});

	it("emitEvents - should dispatch", ({ handler }) => {
		const emitter: Partial<Contracts.Kernel.EventDispatcher> = {
			dispatch: async () => {},
		};
		const spyDispatch = stub(emitter, "dispatch");

		const voteTransaction = getTransaction(["+validatorPublicKey"]);

		handler.emitEvents(
			voteTransaction as Contracts.Crypto.ITransaction,
			emitter as Contracts.Kernel.EventDispatcher,
		);

		spyDispatch.calledOnce();
		spyDispatch.calledWith(AppEnums.VoteEvent.Vote, {
			transaction: voteTransaction.data,
			validator: "+validatorPublicKey",
		});

		spyDispatch.reset();
		const unvoteTransaction = getTransaction(["-validatorPublicKey"]);
		handler.emitEvents(
			unvoteTransaction as Contracts.Crypto.ITransaction,
			emitter as Contracts.Kernel.EventDispatcher,
		);

		spyDispatch.calledOnce();
		spyDispatch.calledWith(AppEnums.VoteEvent.Unvote, {
			transaction: unvoteTransaction.data,
			validator: "-validatorPublicKey",
		});

		spyDispatch.reset();
		const unvoteVoteTransaction = getTransaction(["-validatorPublicKey", "+validatorPublicKey"]);
		handler.emitEvents(
			unvoteVoteTransaction as Contracts.Crypto.ITransaction,
			emitter as Contracts.Kernel.EventDispatcher,
		);

		spyDispatch.calledTimes(2);
		spyDispatch.calledWith(AppEnums.VoteEvent.Unvote, {
			transaction: unvoteVoteTransaction.data,
			validator: "-validatorPublicKey",
		});
		spyDispatch.calledWith(AppEnums.VoteEvent.Vote, {
			transaction: unvoteVoteTransaction.data,
			validator: "+validatorPublicKey",
		});
	});

	it("throwIfCannotEnterPool - should pass", async ({ handler, poolQuery }) => {
		const spyHas = stub(poolQuery, "has").returnValue(false);

		await assert.resolves(() =>
			handler.throwIfCannotEnterPool(getTransaction(["+validatorPublicKey"]) as Contracts.Crypto.ITransaction),
		);

		spyHas.calledOnce();
	});

	it("throwIfCannotEnterPool - should throw", async ({ handler, poolQuery }) => {
		const spyHas = stub(poolQuery, "has").returnValue(true);

		await assert.rejects(
			() =>
				handler.throwIfCannotEnterPool(
					getTransaction(["+validatorPublicKey"]) as Contracts.Crypto.ITransaction,
				),
			Exceptions.PoolError,
		);

		spyHas.calledOnce();
	});
});
