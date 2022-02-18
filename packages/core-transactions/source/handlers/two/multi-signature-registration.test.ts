import { Application, Container, Contracts, Exceptions, Services } from "@arkecosystem/core-kernel";
import { Stores, Wallets } from "@arkecosystem/core-state";
import { Factories, Generators, getWalletAttributeSet, passphrases } from "@arkecosystem/core-test-framework";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { Crypto, Enums, Errors, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import {
	InsufficientBalanceError,
	InvalidMultiSignatureError,
	LegacyMultiSignatureRegistrationError,
	MultiSignatureAlreadyRegisteredError,
	// MultiSignatureKeyCountMismatchError,
	// MultiSignatureMinimumKeysError,
} from "../../errors";
import { buildRecipientWallet, buildSenderWallet, initApp } from "../../../test/app";
import { TransactionHandlerRegistry } from "../handler-registry";
import { TransactionHandler } from "../transaction";

let app: Application;
let senderWallet: Wallets.Wallet;
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
	recipientWallet = buildRecipientWallet(factoryBuilder);

	walletRepository.index(senderWallet);
	walletRepository.index(recipientWallet);
});

describe("MultiSignatureRegistrationTransaction", () => {
	let multiSignatureTransaction: Interfaces.ITransaction;
	let multiSignatureAsset: Interfaces.IMultiSignatureAsset;
	let handler: TransactionHandler;

	beforeEach(async () => {
		const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
			Container.Identifiers.TransactionHandlerRegistry,
		);
		handler = transactionHandlerRegistry.getRegisteredHandlerByType(
			Transactions.InternalTransactionType.from(
				Enums.TransactionType.MultiSignature,
				Enums.TransactionTypeGroup.Core,
			),
			2,
		);

		senderWallet.setBalance(Utils.BigNumber.make(100_390_000_000));

		multiSignatureAsset = {
			min: 2,
			publicKeys: [
				Identities.PublicKey.fromPassphrase(passphrases[0]),
				Identities.PublicKey.fromPassphrase(passphrases[1]),
				Identities.PublicKey.fromPassphrase(passphrases[2]),
			],
		};

		recipientWallet = new Wallets.Wallet(
			Identities.Address.fromMultiSignatureAsset(multiSignatureAsset),
			new Services.Attributes.AttributeMap(getWalletAttributeSet()),
		);

		walletRepository.index(recipientWallet);

		multiSignatureTransaction = Transactions.BuilderFactory.multiSignature()
			.multiSignatureAsset(multiSignatureAsset)
			.senderPublicKey(senderWallet.getPublicKey()!)
			.nonce("1")
			.recipientId(recipientWallet.getPublicKey()!)
			.multiSign(passphrases[0], 0)
			.multiSign(passphrases[1], 1)
			.multiSign(passphrases[2], 2)
			.sign(passphrases[0])
			.build();
	});

	describe("bootstrap", () => {
		it("should resolve", async () => {
			transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
				yield multiSignatureTransaction.data;
			});

			await expect(handler.bootstrap()).toResolve();

			expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
				type: Enums.TransactionType.MultiSignature,
				typeGroup: Enums.TransactionTypeGroup.Core,
				version: 2,
			});
		});

		it("should throw if wallet is multi signature", async () => {
			transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
				yield multiSignatureTransaction.data;
			});
			recipientWallet.setAttribute("multiSignature", multiSignatureTransaction.data.asset.multiSignature);
			await expect(handler.bootstrap()).rejects.toThrow(MultiSignatureAlreadyRegisteredError);
		});

		it("should throw if asset is undefined", async () => {
			multiSignatureTransaction.data.asset = undefined;

			transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
				yield multiSignatureTransaction.data;
			});
			await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
		});
	});

	describe("throwIfCannotBeApplied", () => {
		afterEach(() => {
			Managers.configManager.getMilestone().aip11 = true;
		});

		it("should not throw", async () => {
			await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).toResolve();
		});

		it("should throw if asset is undefined", async () => {
			multiSignatureTransaction.data.asset = undefined;

			await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).rejects.toThrow(
				Exceptions.Runtime.AssertionException,
			);
		});

		it("should throw if the wallet already has multisignatures", async () => {
			recipientWallet.setAttribute("multiSignature", multiSignatureTransaction.data.asset.multiSignature);

			await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).rejects.toThrow(
				MultiSignatureAlreadyRegisteredError,
			);
		});

		it("should throw if failure to verify signatures", async () => {
			handler.verifySignatures = jest.fn(() => false);
			senderWallet.forgetAttribute("multiSignature");

			await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).rejects.toThrow(
				InvalidMultiSignatureError,
			);
		});

		it("should throw with aip11 set to false and transaction is legacy", async () => {
			const legacyAssset: Interfaces.IMultiSignatureLegacyAsset = {
				keysgroup: [
					"+039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
					"+028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0",
					"+021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd",
				],
				// @ts-ignore
				legacy: true,

				lifetime: 0,

				min: 3,
			};

			multiSignatureTransaction.data.version = 1;
			multiSignatureTransaction.data.timestamp = 1000;
			multiSignatureTransaction.data.asset.legacyAsset = legacyAssset;

			Managers.configManager.getMilestone().aip11 = false;

			handler.verifySignatures = jest.fn().mockReturnValue(true);

			await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).rejects.toThrow(
				LegacyMultiSignatureRegistrationError,
			);
		});

		// TODO: check value 02 thwors DuplicateParticipantInMultiSignatureError, 03 throws nodeError
		it("should throw if failure to verify signatures in asset", async () => {
			multiSignatureTransaction.data.signatures[0] = multiSignatureTransaction.data.signatures[0].replace(
				"00",
				"02",
			);
			await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).rejects.toThrow(
				Error,
				// InvalidMultiSignatureError,
			);
		});

		// it("should throw if the number of keys is less than minimum", async () => {
		//     senderWallet.forgetAttribute("multiSignature");

		//     handler.verifySignatures = jest.fn(() => true);
		//     Transactions.Verifier.verifySecondSignature = jest.fn(() => true);

		//     multiSignatureTransaction.data.asset!.multiSignature!.publicKeys.splice(0, 2);
		//     await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).rejects.toThrow(
		//         MultiSignatureMinimumKeysError,
		//     );
		// });

		// it("should throw if the number of keys does not equal the signature count", async () => {
		//     senderWallet.forgetAttribute("multiSignature");

		//     handler.verifySignatures = jest.fn(() => true);
		//     Transactions.Verifier.verifySecondSignature = jest.fn(() => true);

		//     multiSignatureTransaction.data.signatures!.splice(0, 2);
		//     await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).rejects.toThrow(
		//         MultiSignatureKeyCountMismatchError,
		//     );
		// });

		it("should throw if the same participant provides multiple signatures", async () => {
			const passphrases = ["secret1", "secret2", "secret3"];
			const participants = [
				Identities.PublicKey.fromPassphrase(passphrases[0]),
				Identities.PublicKey.fromPassphrase(passphrases[1]),
				Identities.PublicKey.fromPassphrase(passphrases[2]),
			];

			const participantWallet = walletRepository.findByPublicKey(participants[0]);
			participantWallet.setBalance(Utils.BigNumber.make(1e8 * 100));

			multiSignatureTransaction = Transactions.BuilderFactory.multiSignature()
				.multiSignatureAsset({
					min: 2,
					publicKeys: participants,
				})
				.senderPublicKey(Identities.PublicKey.fromPassphrase(passphrases[0]))
				.nonce("1")
				.recipientId(recipientWallet.getPublicKey()!)
				.multiSign(passphrases[0], 0)
				.multiSign(passphrases[1], 1)
				.multiSign(passphrases[2], 2)
				.sign(passphrases[0])
				.build();

			const multiSigWallet = walletRepository.findByPublicKey(
				Identities.PublicKey.fromMultiSignatureAsset(multiSignatureTransaction.data.asset.multiSignature),
			);

			await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, participantWallet)).toResolve();

			expect(multiSigWallet.hasMultiSignature()).toBeFalse();

			await handler.apply(multiSignatureTransaction);

			expect(multiSigWallet.hasMultiSignature()).toBeTrue();

			multiSigWallet.setBalance(Utils.BigNumber.make(1e8 * 100));

			const transferBuilder = factoryBuilder
				.get("Transfer")
				.withOptions({
					amount: 10_000_000,
					recipientId: multiSigWallet.getAddress(),
					senderPublicKey: senderWallet.getPublicKey(),
				})
				.make()
				// @ts-ignore
				.sign(passphrases[0])
				.nonce("1");

			// Different valid signatures of same payload and private key
			const signatures = [
				"774b430573285f09bd8e61bf04582b06ef55ee0e454cd0f86b396c47ea1269f514748e8fb2315f2f0ce4bb81777ae673d8cab44a54a773f3c20cb0c754fd67ed",
				"dfb75f880769c3ae27640e1214a7ece017ddd684980e2276c908fe7806c1d6e8ceac47bb53004d84bdac22cdcb482445c056256a6cd417c5dc973d8266164ec0",
				"64233bb62b694eb0004e1d5d497b0b0e6d977b3a0e2403a9abf59502aef65c36c6e0eed599d314d4f55a03fc0dc48f0c9c9fd4bfab65e5ac8fe2a5c5ac3ed2ae",
			];

			// All verify with participants[0]
			transferBuilder.data.signatures = [];
			for (const signature of signatures) {
				transferBuilder.data.signatures.push(`${Utils.numberToHex(0)}${signature}`);
			}
			//
			expect(() => transferBuilder.build()).toThrow(Errors.DuplicateParticipantInMultiSignatureError);
			expect(() => handler.verifySignatures(multiSigWallet, transferBuilder.getStruct())).toThrow(
				Errors.DuplicateParticipantInMultiSignatureError,
			);
		});

		it("should throw if wallet has insufficient funds", async () => {
			senderWallet.forgetAttribute("multiSignature");
			senderWallet.setBalance(Utils.BigNumber.ZERO);

			await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).rejects.toThrow(
				InsufficientBalanceError,
			);
		});
	});

	describe("throwIfCannotEnterPool", () => {
		it("should not throw", async () => {
			await expect(handler.throwIfCannotEnterPool(multiSignatureTransaction)).toResolve();
		});

		it("should throw if transaction asset is undefined", async () => {
			delete multiSignatureTransaction.data.asset;

			await expect(handler.throwIfCannotEnterPool(multiSignatureTransaction)).rejects.toThrow(
				Exceptions.Runtime.AssertionException,
			);
		});

		it("should throw if transaction by sender already in pool", async () => {
			await app
				.get<Mempool>(Container.Identifiers.TransactionPoolMempool)
				.addTransaction(multiSignatureTransaction);

			await expect(handler.throwIfCannotEnterPool(multiSignatureTransaction)).rejects.toThrow(
				new Contracts.TransactionPool.PoolError(
					"Sender 03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37 already has a transaction of type '4' in the pool",
					"ERR_PENDING",
				),
			);
		});

		it("should throw if transaction with same address already in pool", async () => {
			const anotherSenderWallet = buildSenderWallet(factoryBuilder, "random passphrase");

			const multiSignatureTransactionWithSameAddress = Transactions.BuilderFactory.multiSignature()
				.multiSignatureAsset(multiSignatureAsset)
				.senderPublicKey(anotherSenderWallet.getPublicKey()!)
				.nonce("1")
				.recipientId(recipientWallet.getPublicKey()!)
				.multiSign(passphrases[0], 0)
				.multiSign(passphrases[1], 1)
				.multiSign(passphrases[2], 2)
				.sign("random passphrase")
				.build();

			await app
				.get<Mempool>(Container.Identifiers.TransactionPoolMempool)
				.addTransaction(multiSignatureTransaction);

			await expect(handler.throwIfCannotEnterPool(multiSignatureTransactionWithSameAddress)).rejects.toThrow(
				new Contracts.TransactionPool.PoolError(
					"MultiSignatureRegistration for address ANexvVGYLYUbmTPHAtJ7sb1LxNZwEqKeSv already in the pool",
					"ERR_PENDING",
				),
			);
		});
	});

	describe("apply", () => {
		it("should be ok", async () => {
			recipientWallet.forgetAttribute("multiSignature");

			expect(senderWallet.hasAttribute("multiSignature")).toBeFalse();
			expect(recipientWallet.hasAttribute("multiSignature")).toBeFalse();

			expect(senderWallet.getBalance()).toEqual(Utils.BigNumber.make(100_390_000_000));
			expect(recipientWallet.getBalance()).toEqual(Utils.BigNumber.ZERO);

			await handler.apply(multiSignatureTransaction);

			expect(senderWallet.getBalance()).toEqual(Utils.BigNumber.make(98_390_000_000));
			expect(recipientWallet.getBalance()).toEqual(Utils.BigNumber.ZERO);

			expect(senderWallet.hasAttribute("multiSignature")).toBeFalse();
			expect(recipientWallet.getAttribute("multiSignature")).toEqual(
				multiSignatureTransaction.data.asset.multiSignature,
			);
		});
	});

	describe("applyToRecipient", () => {
		it("should throw if asset is undefined", async () => {
			multiSignatureTransaction.data.asset = undefined;

			handler.throwIfCannotBeApplied = jest.fn();

			await expect(handler.applyToRecipient(multiSignatureTransaction)).rejects.toThrow(
				Exceptions.Runtime.AssertionException,
			);
		});
	});

	describe("revert", () => {
		it("should be ok", async () => {
			senderWallet.setNonce(Utils.BigNumber.make(1));

			await handler.revert(multiSignatureTransaction);

			expect(senderWallet.getNonce().isZero()).toBeTrue();
			expect(senderWallet.hasMultiSignature()).toBeFalse();
			expect(recipientWallet.hasMultiSignature()).toBeFalse();
		});
	});

	describe("revertForRecipient", () => {
		it("should throw if asset is undefined", async () => {
			multiSignatureTransaction.data.asset = undefined;

			await expect(handler.revertForRecipient(multiSignatureTransaction)).rejects.toThrow(
				Exceptions.Runtime.AssertionException,
			);
		});
	});
});