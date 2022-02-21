import { Application, Container, Contracts, Enums as KernelEnums } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { describe, Factories, Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import {
	InsufficientBalanceError,
	NotEnoughDelegatesError,
	VotedForResignedDelegateError,
	WalletAlreadyResignedError,
	WalletNotADelegateError,
} from "../../errors";
import { buildMultiSignatureWallet, buildRecipientWallet, buildSenderWallet, initApp } from "../../../test/app";
import { TransactionHandlerRegistry } from "../handler-registry";
import { TransactionHandler } from "../transaction";

const delegatePassphrase = "my secret passphrase";

describe<{
	app: Application;
	senderWallet: Wallets.Wallet;
	multiSignatureWallet: Wallets.Wallet;
	recipientWallet: Wallets.Wallet;
	walletRepository: Contracts.State.WalletRepository;
	factoryBuilder: Factories.FactoryBuilder;
	allDelegates: Wallets.Wallet[];
	delegateWallet: Wallets.Wallet;
	delegateResignationTransaction: Interfaces.ITransaction;
	handler: TransactionHandler;
	voteHandler: TransactionHandler;
	store: any;
	transactionHistoryService: any;
}>("DelegateResignationTransaction", ({ assert, afterEach, beforeEach, it, spy, stub }) => {
	beforeEach(async (context) => {
		const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4, timestamp: Crypto.Slots.getTime() };
		context.store = stub(Stores.StateStore.prototype, "getLastBlock").returnValue({ data: mockLastBlockData });

		context.delegateResignationTransaction = Transactions.BuilderFactory.delegateResignation()
			.version(2)
			.nonce("1")
			.sign(delegatePassphrase)
			.build();

		context.transactionHistoryService = {
			streamByCriteria: async function* () {
				yield context.delegateResignationTransaction.data;
			},
		};

		const config = Generators.generateCryptoConfigRaw();
		Managers.configManager.setConfig(config);

		context.app = initApp();
		context.app
			.bind(Container.Identifiers.TransactionHistoryService)
			.toConstantValue(context.transactionHistoryService);

		context.walletRepository = context.app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

		context.factoryBuilder = new Factories.FactoryBuilder();
		Factories.Factories.registerWalletFactory(context.factoryBuilder);
		Factories.Factories.registerTransactionFactory(context.factoryBuilder);

		context.senderWallet = buildSenderWallet(context.factoryBuilder);
		context.multiSignatureWallet = buildMultiSignatureWallet();
		context.recipientWallet = buildRecipientWallet(context.factoryBuilder);

		context.walletRepository.index(context.senderWallet);
		context.walletRepository.index(context.multiSignatureWallet);
		context.walletRepository.index(context.recipientWallet);

		const transactionHandlerRegistry: TransactionHandlerRegistry = context.app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);
		context.handler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(
				Enums.TransactionType.DelegateResignation,
				Enums.TransactionTypeGroup.Core,
			),
			2,
		);
		context.voteHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(Enums.TransactionType.Vote, Enums.TransactionTypeGroup.Core),
			2,
		);

		context.allDelegates = [];
		for (const [index, passphrase] of passphrases.entries()) {
			const delegateWallet: Wallets.Wallet = context.factoryBuilder
				.get("Wallet")
				.withOptions({
					nonce: 0,
					passphrase: passphrase,
				})
				.make();

			delegateWallet.setAttribute("delegate", { username: "username" + index });

			context.walletRepository.index(delegateWallet);
			context.allDelegates.push(delegateWallet);
		}

		context.delegateWallet = context.factoryBuilder
			.get("Wallet")
			.withOptions({
				nonce: 0,
				passphrase: delegatePassphrase,
			})
			.make();

		context.delegateWallet.setBalance(Utils.BigNumber.make(66 * 1e8));
		context.delegateWallet.setAttribute("delegate", { username: "dummy" });
		context.walletRepository.index(context.delegateWallet);
	});

	// TODO: assert wallet repository
	it("bootstrap should resolve", async (context) => {
		stub(context.transactionHistoryService, "streamByCriteria").callsFake(async function* () {
			yield context.delegateResignationTransaction.data;
		});

		await expect(context.handler.bootstrap()).toResolve();

		expect(context.transactionHistoryService.streamByCriteria).toBeCalledWith({
			type: Enums.TransactionType.DelegateResignation,
			typeGroup: Enums.TransactionTypeGroup.Core,
		});
	});

	it("bootstrap should resolve - simulate genesis wallet", async (context) => {
		context.allDelegates[0].forgetAttribute("delegate");
		context.walletRepository.index(context.allDelegates[0]);

		await expect(context.handler.bootstrap()).toResolve();
	});

	it("emitEvents should dispatch", async (context) => {
		const emitter: Contracts.Kernel.EventDispatcher = context.app.get<Contracts.Kernel.EventDispatcher>(
			Container.Identifiers.EventDispatcherService,
		);

		const spy = jest.spyOn(emitter, "dispatch");

		context.handler.emitEvents(context.delegateResignationTransaction, emitter);

		expect(spy).toHaveBeenCalledWith(KernelEnums.DelegateEvent.Resigned, expect.anything());
	});

	it("throwIfCannotBeApplied should not throw if wallet is a delegate", async (context) => {
		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).toResolve();
	});

	it("throwIfCannotBeApplied should not throw if wallet is a delegate due too many delegates", async (context) => {
		const anotherDelegate: Wallets.Wallet = context.factoryBuilder
			.get("Wallet")
			.withOptions({
				nonce: 0,
				passphrase: "anotherDelegate",
			})
			.make();

		anotherDelegate.setAttribute("delegate", { username: "another" });
		context.walletRepository.index(anotherDelegate);

		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).toResolve();
	});

	it("throwIfCannotBeApplied should throw if wallet is not a delegate", async (context) => {
		context.delegateWallet.forgetAttribute("delegate");
		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).rejects.toThrow(WalletNotADelegateError);
	});

	it("throwIfCannotBeApplied should throw if wallet has insufficient funds", async (context) => {
		context.delegateWallet.setBalance(Utils.BigNumber.ZERO);
		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).rejects.toThrow(InsufficientBalanceError);
	});

	it("throwIfCannotBeApplied should throw if not enough delegates", async (context) => {
		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).toResolve();
		context.allDelegates[0].setAttribute("delegate.resigned", true);
		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).rejects.toThrow(NotEnoughDelegatesError);
	});

	it("throwIfCannotBeApplied should throw if not enough delegates due to already resigned delegates", async (context) => {
		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).toResolve();

		context.delegateWallet.setAttribute("delegate.resigned", true);

		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).rejects.toThrow(WalletAlreadyResignedError);
	});

	// it("throwIfCannotBeApplied should throw if not enough delegates registered", async () => {
	//     let anotherDelegateWallet: Wallets.Wallet = factoryBuilder
	//         .get("Wallet")
	//         .withOptions({
	//             passphrase: "another delegate passphrase",
	//             nonce: 0
	//         })
	//         .make();
	//
	//     delegateWallet.setAttribute("delegate", {username: "another"});
	//
	//     await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet)).toResolve();
	// });

	it("throwIfCannotEnterPool should not throw", async (context) => {
		await expect(context.handler.throwIfCannotEnterPool(context.delegateResignationTransaction)).toResolve();
	});

	it("throwIfCannotEnterPool should throw if transaction by sender already in pool", async (context) => {
		await context.app
			.get<Mempool>(Container.Identifiers.TransactionPoolMempool)
			.addTransaction(context.delegateResignationTransaction);

		await expect(context.handler.throwIfCannotEnterPool(context.delegateResignationTransaction)).rejects.toThrow(
			Contracts.TransactionPool.PoolError,
		);
	});

	it("apply should apply delegate resignation", async (context) => {
		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).toResolve();

		await context.handler.apply(context.delegateResignationTransaction);
		expect(context.delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
	});

	it("apply should fail when already resigned", async (context) => {
		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).toResolve();

		await context.handler.apply(context.delegateResignationTransaction);
		expect(context.delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).rejects.toThrow(WalletAlreadyResignedError);
	});

	it("apply should fail when not a delegate", async (context) => {
		context.delegateWallet.forgetAttribute("delegate");

		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).rejects.toThrow(WalletNotADelegateError);
	});

	it("apply should fail when voting for a resigned delegate", async (context) => {
		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).toResolve();

		await context.handler.apply(context.delegateResignationTransaction);
		expect(context.delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

		const voteTransaction = Transactions.BuilderFactory.vote()
			.votesAsset(["+" + context.delegateWallet.getPublicKey()])
			.nonce("1")
			.sign(passphrases[0])
			.build();

		await expect(context.voteHandler.throwIfCannotBeApplied(voteTransaction, context.senderWallet)).rejects.toThrow(
			VotedForResignedDelegateError,
		);
	});

	it("revert should be ok", async (context) => {
		expect(context.delegateWallet.hasAttribute("delegate.resigned")).toBeFalse();
		await expect(
			context.handler.throwIfCannotBeApplied(context.delegateResignationTransaction, context.delegateWallet),
		).toResolve();

		await context.handler.apply(context.delegateResignationTransaction);
		expect(context.delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
		await context.handler.revert(context.delegateResignationTransaction);
		expect(context.delegateWallet.hasAttribute("delegate.resigned")).toBeFalse();
	});
});
