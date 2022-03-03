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

describe<{
	sandbox: Sandbox;
	blockProcessor: BlockProcessor;
	baseBlock: any;

	acceptBlockHandler: any;
	alreadyForgedHandler: any;
	exceptionHandler: any;
	incompatibleTransactionsHandler: any;
	invalidGeneratorHandler: any;
	nonceOutOfOrderHandler: any;
	unchainedHandler: any;
	verificationFailedHandler: any;
}>("BlockProcessor", ({ assert, beforeEach, it, spyFn, stubFn }) => {
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

	beforeEach((context) => {
		context.sandbox = new Sandbox();

		context.acceptBlockHandler = spyFn();
		context.alreadyForgedHandler = spyFn();
		context.exceptionHandler = spyFn();
		context.incompatibleTransactionsHandler = spyFn();
		context.invalidGeneratorHandler = spyFn();
		context.nonceOutOfOrderHandler = spyFn();
		context.unchainedHandler = spyFn();
		context.verificationFailedHandler = spyFn();

		context.sandbox.app.bind(AcceptBlockHandler).to(context.acceptBlockHandler as any);
		context.sandbox.app.bind(AlreadyForgedHandler).to(context.alreadyForgedHandler as any);
		context.sandbox.app.bind(ExceptionHandler).to(context.exceptionHandler as any);
		context.sandbox.app.bind(IncompatibleTransactionsHandler).to(context.incompatibleTransactionsHandler as any);
		context.sandbox.app.bind(InvalidGeneratorHandler).to(context.invalidGeneratorHandler as any);
		context.sandbox.app.bind(NonceOutOfOrderHandler).to(context.nonceOutOfOrderHandler as any);
		context.sandbox.app.bind(UnchainedHandler).to(context.unchainedHandler as any);
		context.sandbox.app.bind(VerificationFailedHandler).to(context.verificationFailedHandler() as any);

		context.sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logService);
		context.sandbox.app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
		context.sandbox.app
			.bind(Container.Identifiers.DatabaseTransactionRepository)
			.toConstantValue(transactionRepository);
		context.sandbox.app.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);
		context.sandbox.app.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);
		context.sandbox.app.bind(Container.Identifiers.DatabaseInteraction).toConstantValue(databaseInteractions);
		context.sandbox.app.bind(Container.Identifiers.DatabaseInterceptor).toConstantValue(databaseInterceptor);
		context.sandbox.app.bind(Container.Identifiers.RoundState).toConstantValue(roundState);
		context.sandbox.app
			.bind(Container.Identifiers.TransactionHandlerRegistry)
			.toConstantValue(transactionHandlerRegistry);
		context.sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
		context.sandbox.app.bind(Container.Identifiers.TransactionPoolService).toConstantValue({});

		context.sandbox.app
			.bind(Container.Identifiers.TriggerService)
			.to(Services.Triggers.Triggers)
			.inSingletonScope();
		context.sandbox.app
			.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
			.bind("getActiveDelegates", new Actions.GetActiveDelegatesAction(context.sandbox.app));

		context.baseBlock = {
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

		context.blockProcessor = context.sandbox.app.resolve<BlockProcessor>(BlockProcessor);
	});

	it("should execute VerificationFailedHandler when !block.verification.verified", async (context) => {
		const block = { ...context.baseBlock, verification: { ...context.baseBlock.verification, verified: false } };

		await context.blockProcessor.process(block);

		assert.true(context.verificationFailedHandler.execute.calledOnce);
	});

	it("should execute VerificationFailedHandler when handler.verify() fails on one transaction (containsMultiSignatures)", async (context) => {
		const block = {
			...context.baseBlock,
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

		await context.blockProcessor.process(block);

		assert.true(context.verificationFailedHandler.execute.calledOnce);
	});

	it("should execute VerificationFailedHandler when block.verify() fails (containsMultiSignatures)", async (context) => {
		const block = {
			...context.baseBlock,
			verification: { verified: true, errors: [], containsMultiSignatures: true },
			verify: stubFn().returns(false),
		};

		await context.blockProcessor.process(block);

		assert.true(context.verificationFailedHandler.execute.calledOnce);
		assert.true(block.verify.calledOnce);
	});

	it("should execute IncompatibleTransactionsHandler when block contains incompatible transactions", async (context) => {
		const block = {
			...context.baseBlock,
			transactions: [
				{ data: { id: "1", version: 1 } } as Interfaces.ITransaction,
				{ data: { id: "2", version: 2 } } as Interfaces.ITransaction,
			],
		};

		await context.blockProcessor.process(block);

		assert.true(context.incompatibleTransactionsHandler.execute.calledOnce);
	});

	it("should execute NonceOutOfOrderHandler when block has out of order nonce", async (context) => {
		const baseTransactionData = {
			id: "1",
			version: 2,
			senderPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
			nonce: Utils.BigNumber.make(2),
		} as Interfaces.ITransactionData;
		const block = {
			...context.baseBlock,
			transactions: [
				{ data: { ...baseTransactionData } } as Interfaces.ITransaction,
				{
					data: { ...baseTransactionData, id: "2", nonce: Utils.BigNumber.make(4) },
				} as Interfaces.ITransaction,
			],
		};

		walletRepository.getNonce.returns(Utils.BigNumber.ONE);

		await context.blockProcessor.process(block);

		assert.true(context.nonceOutOfOrderHandler.execute.calledOnce);
	});

	it("should not execute NonceOutOfOrderHandler when block has v1 transactions and nonce out of order", async (context) => {
		const baseTransactionData = {
			id: "1",
			version: 1,
			senderPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
		} as Interfaces.ITransactionData;
		const block = {
			...context.baseBlock,
			transactions: [
				{ data: { ...baseTransactionData } } as Interfaces.ITransaction,
				{ data: { ...baseTransactionData, id: "2" } } as Interfaces.ITransaction,
			],
		};

		walletRepository.getNonce = stubFn().returns(Utils.BigNumber.ONE);
		roundState.getActiveDelegates = stubFn().returns([]);
		blockchain.getLastBlock = stubFn().returns(context.baseBlock);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey = stubFn().returns(generatorWallet);
		UnchainedHandler.prototype.initialize = stubFn().returns(new UnchainedHandler());

		await context.blockProcessor.process(block);

		assert.true(context.nonceOutOfOrderHandler.execute.notCalled);
	});

	it("should execute UnchainedHandler when block is not chained", async (context) => {
		const block = {
			...context.baseBlock,
		};
		blockchain.getLastBlock = stubFn().returns(context.baseBlock);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey = stubFn().returns(generatorWallet);
		UnchainedHandler.prototype.initialize = stubFn().returns(new UnchainedHandler());
		roundState.getActiveDelegates = stubFn().returns([]);

		await context.blockProcessor.process(block);

		assert.true(context.unchainedHandler.execute.calledOnce);
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

	it("should execute InvalidGeneratorHandler when block has invalid generator", async (context) => {
		const block = {
			...chainedBlock,
		};
		blockchain.getLastBlock.returns(context.baseBlock);
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

		await assert.resolves(() => context.blockProcessor.process(block));

		assert.true(context.invalidGeneratorHandler.execute.calledOnce);
	});

	it("should execute InvalidGeneratorHandler when generatorWallet.getAttribute() throws", async (context) => {
		const block = {
			...chainedBlock,
		};
		blockchain.getLastBlock.returns(context.baseBlock);
		const generatorWallet = {
			getAttribute: stubFn().rejects(new Error("oops")),
		};
		walletRepository.findByPublicKey.returns(generatorWallet);

		const notBlockGenerator = {
			publicKey: "02ff171adaef486b7db9fc160b28433d20cf43163d56fd28fee72145f0d5219a4b",
		};

		roundState.getActiveDelegates.returns([notBlockGenerator]);

		await context.blockProcessor.process(block);

		assert.true(context.invalidGeneratorHandler.execute.calledOnce);
	});

	it("should execute AlreadyForgedHandler when block has already forged transactions in database", async (context) => {
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
		blockchain.getLastBlock.returns(context.baseBlock);
		transactionRepository.getForgedTransactionsIds.returns([transactionData.id]);
		walletRepository.getNonce.returns(Utils.BigNumber.ONE);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey.returns(generatorWallet);
		stateStore.getLastBlock.returns(context.baseBlock);
		stateStore.getLastStoredBlockHeight.returns(context.baseBlock.data.height);
		stateStore.getLastBlocks.returns([]);

		await context.blockProcessor.process(block);

		assert.true(context.alreadyForgedHandler.execute.calledOnce);
	});

	it("should execute AlreadyForgedHandler when block has already forged transactions in stateStore", async (context) => {
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
		blockchain.getLastBlock.returns(context.baseBlock);
		transactionRepository.getForgedTransactionsIds.returns([]);
		walletRepository.getNonce.returns(Utils.BigNumber.ONE);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey.returns(generatorWallet);
		stateStore.getLastBlock.returns({ data: { height: 2 } });
		stateStore.getLastBlocks.returns([{ data: { height: 2 }, transactions: [transactionData, transactionData2] }]);
		stateStore.getLastStoredBlockHeight.returns(1);

		await context.blockProcessor.process(block);

		assert.true(context.alreadyForgedHandler.execute.calledOnce);
	});

	it.only("should execute AcceptBlockHandler when all above verifications passed", async (context) => {
		const block = {
			...chainedBlock,
		};
		roundState.getActiveDelegates.returns([]);
		blockchain.getLastBlock.returns(context.baseBlock);
		transactionRepository.getForgedTransactionsIds.returns([]);
		const generatorWallet = {
			getAttribute: stubFn().returns("generatorusername"),
		};
		walletRepository.findByPublicKey.returns(generatorWallet);

		await context.blockProcessor.process(block);

		assert.true(context.acceptBlockHandler.execute.calledOnce);
	});
});
