import { Application, Container, Contracts, Enums as KernelEnums } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { Factories, Generators, passphrases } from "@arkecosystem/core-test-framework";
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

let app: Application;
let senderWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: Factories.FactoryBuilder;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { height: 4, timestamp: Crypto.Slots.getTime() };

const mockGetLastBlock = jest.fn();
Stores.StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

const transactionHistoryService = {
	streamByCriteria: jest.fn(),
};

beforeEach(() => {
	transactionHistoryService.streamByCriteria.mockReset();

	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);

	app = initApp();
	app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

	walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

	factoryBuilder = new Factories.FactoryBuilder();
	Factories.Factories.registerWalletFactory(factoryBuilder);
	Factories.Factories.registerTransactionFactory(factoryBuilder);

	senderWallet = buildSenderWallet(factoryBuilder);
	multiSignatureWallet = buildMultiSignatureWallet();
	recipientWallet = buildRecipientWallet(factoryBuilder);

	walletRepository.index(senderWallet);
	walletRepository.index(multiSignatureWallet);
	walletRepository.index(recipientWallet);
});

describe("DelegateResignationTransaction", () => {
	let allDelegates: Wallets.Wallet[];
	let delegateWallet: Wallets.Wallet;
	const delegatePassphrase = "my secret passphrase";

	let delegateResignationTransaction: Interfaces.ITransaction;
	let handler: TransactionHandler;
	let voteHandler: TransactionHandler;

	beforeEach(async () => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);
		handler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(
				Enums.TransactionType.DelegateResignation,
				Enums.TransactionTypeGroup.Core,
			),
			2,
		);
		voteHandler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(Enums.TransactionType.Vote, Enums.TransactionTypeGroup.Core),
			2,
		);

		allDelegates = [];
		for (const [index, passphrase] of passphrases.entries()) {
			const delegateWallet: Wallets.Wallet = factoryBuilder
				.get("Wallet")
				.withOptions({
					nonce: 0,
					passphrase: passphrase,
				})
				.make();

			delegateWallet.setAttribute("delegate", { username: "username" + index });

			walletRepository.index(delegateWallet);
			allDelegates.push(delegateWallet);
		}

		delegateWallet = factoryBuilder
			.get("Wallet")
			.withOptions({
				nonce: 0,
				passphrase: delegatePassphrase,
			})
			.make();

		delegateWallet.setBalance(Utils.BigNumber.make(66 * 1e8));
		delegateWallet.setAttribute("delegate", { username: "dummy" });
		walletRepository.index(delegateWallet);

		delegateResignationTransaction = Transactions.BuilderFactory.delegateResignation()
			.nonce("1")
			.sign(delegatePassphrase)
			.build();
	});

	describe("bootstrap", () => {
		// TODO: assert wallet repository

		it("should resolve", async () => {
			transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
				yield delegateResignationTransaction.data;
			});

			await expect(handler.bootstrap()).toResolve();

			expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
				type: Enums.TransactionType.DelegateResignation,
				typeGroup: Enums.TransactionTypeGroup.Core,
			});
		});

		it("should resolve - simulate genesis wallet", async () => {
			transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
				yield delegateResignationTransaction.data;
			});
			allDelegates[0].forgetAttribute("delegate");
			walletRepository.index(allDelegates[0]);

			await expect(handler.bootstrap()).toResolve();
		});
	});

	describe("emitEvents", () => {
		it("should dispatch", async () => {
			const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
				Container.Identifiers.EventDispatcherService,
			);

			const spy = jest.spyOn(emitter, "dispatch");

			handler.emitEvents(delegateResignationTransaction, emitter);

			expect(spy).toHaveBeenCalledWith(KernelEnums.DelegateEvent.Resigned, expect.anything());
		});
	});

	describe("throwIfCannotBeApplied", () => {
		it("should not throw if wallet is a delegate", async () => {
			await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet)).toResolve();
		});

		it("should not throw if wallet is a delegate due too many delegates", async () => {
			const anotherDelegate: Wallets.Wallet = factoryBuilder
				.get("Wallet")
				.withOptions({
					nonce: 0,
					passphrase: "anotherDelegate",
				})
				.make();

			anotherDelegate.setAttribute("delegate", { username: "another" });
			walletRepository.index(anotherDelegate);

			await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet)).toResolve();
		});

		it("should throw if wallet is not a delegate", async () => {
			delegateWallet.forgetAttribute("delegate");
			await expect(
				handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet),
			).rejects.toThrow(WalletNotADelegateError);
		});

		it("should throw if wallet has insufficient funds", async () => {
			delegateWallet.setBalance(Utils.BigNumber.ZERO);
			await expect(
				handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet),
			).rejects.toThrow(InsufficientBalanceError);
		});

		it("should throw if not enough delegates", async () => {
			await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet)).toResolve();
			allDelegates[0].setAttribute("delegate.resigned", true);
			await expect(
				handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet),
			).rejects.toThrow(NotEnoughDelegatesError);
		});

		it("should throw if not enough delegates due to already resigned delegates", async () => {
			await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet)).toResolve();

			delegateWallet.setAttribute("delegate.resigned", true);

			await expect(
				handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet),
			).rejects.toThrow(WalletAlreadyResignedError);
		});

		// it("should throw if not enough delegates registered", async () => {
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
	});

	describe("throwIfCannotEnterPool", () => {
		it("should not throw", async () => {
			await expect(handler.throwIfCannotEnterPool(delegateResignationTransaction)).toResolve();
		});

		it("should throw if transaction by sender already in pool", async () => {
			await app
				.get<Mempool>(Container.Identifiers.TransactionPoolMempool)
				.addTransaction(delegateResignationTransaction);

			await expect(handler.throwIfCannotEnterPool(delegateResignationTransaction)).rejects.toThrow(
				Contracts.TransactionPool.PoolError,
			);
		});
	});

	describe("apply", () => {
		it("should apply delegate resignation", async () => {
			await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet)).toResolve();

			await handler.apply(delegateResignationTransaction);
			expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
		});

		it("should fail when already resigned", async () => {
			await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet)).toResolve();

			await handler.apply(delegateResignationTransaction);
			expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

			await expect(
				handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet),
			).rejects.toThrow(WalletAlreadyResignedError);
		});

		it("should fail when not a delegate", async () => {
			delegateWallet.forgetAttribute("delegate");

			await expect(
				handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet),
			).rejects.toThrow(WalletNotADelegateError);
		});

		it("should fail when voting for a resigned delegate", async () => {
			await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet)).toResolve();

			await handler.apply(delegateResignationTransaction);
			expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

			const voteTransaction = Transactions.BuilderFactory.vote()
				.votesAsset(["+" + delegateWallet.getPublicKey()])
				.nonce("1")
				.sign(passphrases[0])
				.build();

			await expect(voteHandler.throwIfCannotBeApplied(voteTransaction, senderWallet)).rejects.toThrow(
				VotedForResignedDelegateError,
			);
		});
	});

	describe("revert", () => {
		it("should be ok", async () => {
			expect(delegateWallet.hasAttribute("delegate.resigned")).toBeFalse();
			await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet)).toResolve();

			await handler.apply(delegateResignationTransaction);
			expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
			await handler.revert(delegateResignationTransaction);
			expect(delegateWallet.hasAttribute("delegate.resigned")).toBeFalse();
		});
	});
});