import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Container, Services } from "@arkecosystem/core-kernel";
import { Actions } from "@arkecosystem/core-state";

import {
	AcceptBlockHandler,
	AlreadyForgedHandler,
	ExceptionHandler,
	IncompatibleTransactionsHandler,
	InvalidGeneratorHandler,
	NonceOutOfOrderHandler,
	UnchainedHandler,
	VerificationFailedHandler,
} from "./handlers";
import { describe, Sandbox } from "../../../core-test-framework";
import { BlockProcessor } from "./block-processor";

describe("BlockProcessor", ({ assert, beforeEach, it, spyFn, stubFn }) => {
	AcceptBlockHandler.prototype.execute = spyFn();
	AlreadyForgedHandler.prototype.execute = spyFn();
	ExceptionHandler.prototype.execute = spyFn();
	IncompatibleTransactionsHandler.prototype.execute = spyFn();
	InvalidGeneratorHandler.prototype.execute = spyFn();
	NonceOutOfOrderHandler.prototype.execute = spyFn();
	UnchainedHandler.prototype.initialize = spyFn();
	UnchainedHandler.prototype.execute = spyFn();
	VerificationFailedHandler.prototype.execute = spyFn();

	const sandbox = new Sandbox();

	const logService = { warning: spyFn(), info: spyFn(), error: spyFn(), debug: spyFn() };
	const blockchain = { getLastBlock: stubFn() };
	const transactionRepository = { getForgedTransactionsIds: stubFn() };

	const walletRepository = {
		findByPublicKey: stubFn(),
		getNonce: stubFn(),
	};
	const transactionHandlerRegistry = {
		getActivatedHandlerForData: stubFn(),
	};
	const databaseService = {};
	const databaseInteractions = {
		walletRepository: {
			getNonce: spyFn(),
		},
		getTopBlocks: spyFn(),
		getLastBlock: spyFn(),
		restoreCurrentRound: spyFn(),
		revertBlock: spyFn(),
		deleteRound: spyFn(),
	};
	const roundState = {
		getActiveDelegates: stubFn().returns([]),
	};
	const stateStore = {
		getLastBlock: stubFn(),
		getLastBlocks: stubFn(),
		getLastStoredBlockHeight: stubFn(),
	};

	const databaseInterceptor = {};

	beforeEach(() => {
		sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logService);
		sandbox.app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
		sandbox.app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);
		sandbox.app.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);
		sandbox.app.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);
		sandbox.app.bind(Container.Identifiers.DatabaseInteraction).toConstantValue(databaseInteractions);
		sandbox.app.bind(Container.Identifiers.DatabaseInterceptor).toConstantValue(databaseInterceptor);
		sandbox.app.bind(Container.Identifiers.RoundState).toConstantValue(roundState);
		sandbox.app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue(transactionHandlerRegistry);
		sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
		sandbox.app.bind(Container.Identifiers.TransactionPoolService).toConstantValue({});

		sandbox.app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();
		sandbox.app
			.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
			.bind("getActiveDelegates", new Actions.GetActiveDelegatesAction(sandbox.app));
	});

	const baseBlock = {
		data: {
			id: "17882607875259085966",
			version: 0,
			timestamp: 46583330,
			height: 2,
			reward: Utils.BigNumber.make("0"),
			previousBlock: "17184958558311101492",
			numberOfTransactions: 0,
			totalAmount: Utils.BigNumber.make("0"),
			totalFee: Utils.BigNumber.make("0"),
			payloadLength: 0,
			payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			generatorPublicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
			blockSignature:
				"3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
			createdAt: "2018-09-11T16:48:50.550Z",
		},
		serialized: "",
		verification: { verified: true, errors: [], containsMultiSignatures: false },
		getHeader: spyFn(),
		verify: spyFn(),
		verifySignature: spyFn(),
		toJson: spyFn(),
		transactions: [],
	};

	it("should execute VerificationFailedHandler when !block.verification.verified", async () => {
		const block = { ...baseBlock, verification: { ...baseBlock.verification, verified: false } };

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(VerificationFailedHandler.prototype.execute).toBeCalledTimes(1);
	});

	it("should execute VerificationFailedHandler when handler.verify() fails on one transaction (containsMultiSignatures)", async () => {
		const block = {
			...baseBlock,
			verification: { verified: true, errors: [], containsMultiSignatures: true },
			verify: stubFn().returns(true),
			transactions: [
				{
					data: {
						type: 0,
						typeGroup: 1,
						version: 1,
						amount: Utils.BigNumber.make("12500000000000000"),
						fee: Utils.BigNumber.ZERO,
						recipientId: "D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax",
						timestamp: 0,
						asset: {},
						senderPublicKey: "0208e6835a8f020cfad439c059b89addc1ce21f8cab0af6e6957e22d3720bff8a4",
						signature:
							"304402203a3f0f80aad4e0561ae975f241f72a074245f1205d676d290d6e5630ed4c027502207b31fee68e64007c380a4b6baccd4db9b496daef5f7894676586e1347ac30a3b",
						id: "3e3817fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572",
					},
				} as Interfaces.ITransaction,
			],
		};
		transactionHandlerRegistry.getActivatedHandlerForData.returns({
			verify: stubFn().rejects(new Error("oops")),
		});
		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(VerificationFailedHandler.prototype.execute).toBeCalledTimes(1);
	});

	it("should execute VerificationFailedHandler when block.verify() fails (containsMultiSignatures)", async () => {
		const block = {
			...baseBlock,
			verification: { verified: true, errors: [], containsMultiSignatures: true },
			verify: stubFn().returns(false),
		};

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(VerificationFailedHandler.prototype.execute).toBeCalledTimes(1);
		expect(block.verify).toBeCalledTimes(1);
	});

	it("should execute IncompatibleTransactionsHandler when block contains incompatible transactions", async () => {
		const block = {
			...baseBlock,
			transactions: [
				{ data: { id: "1", version: 1 } } as Interfaces.ITransaction,
				{ data: { id: "2", version: 2 } } as Interfaces.ITransaction,
			],
		};

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(IncompatibleTransactionsHandler.prototype.execute).toBeCalledTimes(1);
	});

	it("should execute NonceOutOfOrderHandler when block has out of order nonce", async () => {
		const baseTransactionData = {
			id: "1",
			version: 2,
			senderPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
			nonce: Utils.BigNumber.make(2),
		} as Interfaces.ITransactionData;
		const block = {
			...baseBlock,
			transactions: [
				{ data: { ...baseTransactionData } } as Interfaces.ITransaction,
				{
					data: { ...baseTransactionData, id: "2", nonce: Utils.BigNumber.make(4) },
				} as Interfaces.ITransaction,
			],
		};

		walletRepository.getNonce.returns(Utils.BigNumber.ONE);

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(NonceOutOfOrderHandler.prototype.execute).toBeCalledTimes(1);
	});

	it("should not execute NonceOutOfOrderHandler when block has v1 transactions and nonce out of order", async () => {
		const baseTransactionData = {
			id: "1",
			version: 1,
			senderPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
		} as Interfaces.ITransactionData;
		const block = {
			...baseBlock,
			transactions: [
				{ data: { ...baseTransactionData } } as Interfaces.ITransaction,
				{ data: { ...baseTransactionData, id: "2" } } as Interfaces.ITransaction,
			],
		};

		walletRepository.getNonce = stubFn().returns(Utils.BigNumber.ONE);
		roundState.getActiveDelegates = stubFn().returns([]);
		blockchain.getLastBlock = stubFn().returns(baseBlock);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey = stubFn().returns(generatorWallet);
		UnchainedHandler.prototype.initialize = stubFn().returns(new UnchainedHandler());

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(NonceOutOfOrderHandler.prototype.execute).toBeCalledTimes(0);
	});

	it("should execute UnchainedHandler when block is not chained", async () => {
		const block = {
			...baseBlock,
		};
		blockchain.getLastBlock = stubFn().returns(baseBlock);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey = stubFn().returns(generatorWallet);
		UnchainedHandler.prototype.initialize = stubFn().returns(new UnchainedHandler());
		roundState.getActiveDelegates = stubFn().returns([]);

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(UnchainedHandler.prototype.execute).toBeCalledTimes(1);
	});

	const chainedBlock = {
		data: {
			id: "7242383292164246617",
			version: 0,
			timestamp: 46583338,
			height: 3,
			reward: Utils.BigNumber.make("0"),
			previousBlock: "17882607875259085966",
			numberOfTransactions: 0,
			totalAmount: Utils.BigNumber.make("0"),
			totalFee: Utils.BigNumber.make("0"),
			payloadLength: 0,
			payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			generatorPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
			blockSignature:
				"304402204087bb1d2c82b9178b02b9b3f285de260cdf0778643064fe6c7aef27321d49520220594c57009c1fca543350126d277c6adeb674c00685a464c3e4bf0d634dc37e39",
			createdAt: "2018-09-11T16:48:58.431Z",
		},
		serialized: "",
		verification: { verified: true, errors: [], containsMultiSignatures: false },
		getHeader: spyFn(),
		verify: spyFn(),
		verifySignature: spyFn(),
		toJson: spyFn(),
		transactions: [],
	};

	it("should execute InvalidGeneratorHandler when block has invalid generator", async () => {
		const block = {
			...chainedBlock,
		};
		blockchain.getLastBlock.returns(baseBlock);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey.returns(generatorWallet);
		const notBlockGenerator = {
			getPublicKey: () => {
				return "02ff171adaef486b7db9fc160b28433d20cf43163d56fd28fee72145f0d5219a4b";
			},
		};

		const activeDelegatesWithoutGenerator = [];
		activeDelegatesWithoutGenerator.length = 51;
		activeDelegatesWithoutGenerator.fill(notBlockGenerator, 0);

		roundState.getActiveDelegates.returns(activeDelegatesWithoutGenerator);

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await expect(blockProcessor.process(block)).toResolve();

		expect(InvalidGeneratorHandler.prototype.execute).toBeCalledTimes(1);
	});

	it("should execute InvalidGeneratorHandler when generatorWallet.getAttribute() throws", async () => {
		const block = {
			...chainedBlock,
		};
		blockchain.getLastBlock.returns(baseBlock);
		const generatorWallet = {
			getAttribute: stubFn().rejects( new Error("oops")),
		};
		walletRepository.findByPublicKey.returns(generatorWallet);

		const notBlockGenerator = {
			publicKey: "02ff171adaef486b7db9fc160b28433d20cf43163d56fd28fee72145f0d5219a4b",
		};

		roundState.getActiveDelegates.returns([notBlockGenerator]);

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(InvalidGeneratorHandler.prototype.execute).toBeCalledTimes(1);
	});

	it("should execute AlreadyForgedHandler when block has already forged transactions in database", async () => {
		const transactionData = {
			id: "34821dfa9cbe59aad663b972326ff19265d788c4d4142747606aa29b19d6b1dab",
			version: 2,
			senderPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
			nonce: Utils.BigNumber.make(2),
		} as Interfaces.ITransactionData;
		const block = {
			...chainedBlock,
			transactions: [{ data: transactionData, id: transactionData.id } as Interfaces.ITransaction],
		};
		roundState.getActiveDelegates.returns([]);
		blockchain.getLastBlock.returns(baseBlock);
		transactionRepository.getForgedTransactionsIds.returns([transactionData.id]);
		walletRepository.getNonce.returns(Utils.BigNumber.ONE);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey.returns(generatorWallet);
		stateStore.getLastBlock.returns(baseBlock);
		stateStore.getLastStoredBlockHeight.returns(baseBlock.data.height);
		stateStore.getLastBlocks.returns([]);

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(AlreadyForgedHandler.prototype.execute).toBeCalledTimes(1);
	});

	it("should execute AlreadyForgedHandler when block has already forged transactions in stateStore", async () => {
		const transactionData = {
			id: "34821dfa9cbe59aad663b972326ff19265d788c4d4142747606aa29b19d6b1dab",
			version: 2,
			senderPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
			nonce: Utils.BigNumber.make(2),
		} as Interfaces.ITransactionData;
		const transactionData2 = {
			id: "34821dfa9cbe59aad663b972326ff19265d788c4d4142747606aa29b19d6b1dac",
			version: 2,
			senderPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
			nonce: Utils.BigNumber.make(3),
		} as Interfaces.ITransactionData;
		const block = {
			...chainedBlock,
			transactions: [{ data: transactionData, id: transactionData.id } as Interfaces.ITransaction],
		};
		roundState.getActiveDelegates.returns([]);
		blockchain.getLastBlock.returns(baseBlock);
		transactionRepository.getForgedTransactionsIds.returns([]);
		walletRepository.getNonce.returns(Utils.BigNumber.ONE);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey.returns(generatorWallet);
		stateStore.getLastBlock.returns({ data: { height: 2 } });
		stateStore.getLastBlocks.returns([
			{ data: { height: 2 }, transactions: [transactionData, transactionData2] },
		]);
		stateStore.getLastStoredBlockHeight.returns(1);

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(AlreadyForgedHandler.prototype.execute).toBeCalledTimes(1);
	});

	it("should execute AcceptBlockHandler when all above verifications passed", async () => {
		const block = {
			...chainedBlock,
		};
		roundState.getActiveDelegates.returns([]);
		blockchain.getLastBlock.returns(baseBlock);
		transactionRepository.getForgedTransactionsIds.returns([]);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey.returns(generatorWallet);

		const blockProcessor = sandbox.app.resolve<BlockProcessor>(BlockProcessor);

		await blockProcessor.process(block);

		expect(AcceptBlockHandler.prototype.execute).toBeCalledTimes(1);
	});
});
