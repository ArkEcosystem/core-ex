import { Container, Contracts, Enums, Services, Utils } from "@arkecosystem/core-kernel";
import { NetworkStateStatus } from "../../core-p2p/source";
import { Actions } from "@arkecosystem/core-state";
import { Crypto, Identities, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { describe, Sandbox } from "../../core-test-framework/source";

import { ForgerService } from "./forger-service";
import { ForgeNewBlockAction, IsForgingAllowedAction } from "./actions";
import { HostNoResponseError, RelayCommunicationError } from "./errors";

import { calculateActiveDelegates } from "../test/calculate-active-delegates";

describe<{
	sandbox: Sandbox;
	forgerService: ForgerService;
	delegates;
	mockNetworkState;
	mockTransaction;
	transaction;
	mockRound;
	round;
	logger: any;
	client: any;
	handlerProvider: any;
}>("ForgerService", ({ assert, beforeEach, it, stub }) => {
	const mockHost = { hostname: "127.0.0.1", port: 4000 };

	beforeEach((context) => {
		context.logger = {
			error: jest.fn(),
			debug: jest.fn(),
			info: jest.fn(),
			warning: jest.fn(),
		};

		context.client = {
			register: jest.fn(),
			dispose: jest.fn(),
			broadcastBlock: jest.fn(),
			syncWithNetwork: jest.fn(),
			getRound: jest.fn(),
			getNetworkState: jest.fn(),
			getTransactions: jest.fn(),
			emitEvent: jest.fn(),
			selectHost: jest.fn(),
		};

		context.handlerProvider = {
			isRegistrationRequired: jest.fn(),
			registerHandlers: jest.fn(),
		};

		context.sandbox = new Sandbox();
		context.sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(context.logger);
		context.sandbox.app
			.bind(Container.Identifiers.TransactionHandlerProvider)
			.toConstantValue(context.handlerProvider);

		context.sandbox.app
			.bind(Container.Identifiers.TriggerService)
			.to(Services.Triggers.Triggers)
			.inSingletonScope();

		context.sandbox.app
			.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
			.bind("getActiveDelegates", new Actions.GetActiveDelegatesAction(context.sandbox.app));

		context.sandbox.app
			.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
			.bind("forgeNewBlock", new ForgeNewBlockAction());

		context.sandbox.app
			.get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
			.bind("isForgingAllowed", new IsForgingAllowedAction());

		const getTimeStampForBlock = (height: number) => {
			switch (height) {
				case 1:
					return 0;
				default:
					throw new Error(`Test scenarios should not hit this line`);
			}
		};

		jest.spyOn(Utils.forgingInfoCalculator, "getBlockTimeLookup").mockResolvedValue(getTimeStampForBlock);

		context.forgerService = context.sandbox.app.resolve<ForgerService>(ForgerService);

		jest.spyOn(context.sandbox.app, "resolve").mockReturnValueOnce(context.client); // forger-service only resolves Client

		const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		slotSpy.mockReturnValue(0);

		context.delegates = calculateActiveDelegates();

		context.round = {
			data: {
				delegates: context.delegates,
				timestamp: Crypto.Slots.getTime() - 3,
				reward: 0,
				lastBlock: { height: 100 },
			},
			canForge: false,
		};

		context.mockNetworkState = {
			status: NetworkStateStatus.Default,
			getNodeHeight: () => 10,
			getLastBlockId: () => "11111111",
			getOverHeightBlockHeaders: () => [],
			getQuorum: () => 0.7,
			toJson: () => "test json",
		};

		const recipientAddress = Identities.Address.fromPassphrase("recipient's secret");
		context.transaction = Transactions.BuilderFactory.transfer()
			.version(1)
			.amount("100")
			.recipientId(recipientAddress)
			.sign("sender's secret")
			.build();

		context.mockTransaction = {
			transactions: [context.transaction.serialized.toString("hex")],
			poolSize: 10,
			count: 10,
		};

		context.mockRound = {
			timestamp: Crypto.Slots.getTime() - 5,
			reward: 0,
			lastBlock: { height: 100 },
		};
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it("GetRound should return undefined", (context) => {
		context.forgerService.register({ hosts: [mockHost] });

		expect(context.forgerService.getRound()).toBeUndefined();
	});

	it("GetRemainingSlotTime should return undefined", (context) => {
		context.forgerService.register({ hosts: [mockHost] });

		expect(context.forgerService.getRemainingSlotTime()).toBeUndefined();
	});

	it("GetLastForgedBlock should return undefined", (context) => {
		context.forgerService.register({ hosts: [mockHost] });

		expect(context.forgerService.getLastForgedBlock()).toBeUndefined();
	});

	it("Register should register an associated client", async (context) => {
		context.forgerService.register({ hosts: [mockHost] });

		expect(context.client.register).toBeCalledTimes(1);
		expect(context.client.register).toBeCalledWith([mockHost]);
	});

	it("Dispose should dispose of an associated client", async (context) => {
		context.forgerService.register({ hosts: [mockHost] });
		const spyDisposeClient = jest.spyOn((context.forgerService as any).client, "dispose");
		// @ts-ignore
		expect(context.forgerService.isStopped).toEqual(false);
		context.forgerService.dispose();
		expect(spyDisposeClient).toHaveBeenCalled();
		// @ts-ignore
		expect(context.forgerService.isStopped).toEqual(true);
	});

	it("Boot should register handlers, set delegates, and log active delegates info message", async (context) => {
		context.handlerProvider.isRegistrationRequired.mockReturnValue(true);

		context.forgerService.register({ hosts: [mockHost] });
		context.client.getRound.mockReturnValueOnce({ delegates: context.delegates });

		await expect(context.forgerService.boot(context.delegates)).toResolve();

		expect((context.forgerService as any).delegates).toEqual(context.delegates);

		const expectedInfoMessage = `Loaded ${Utils.pluralize(
			"active delegate",
			context.delegates.length,
			true,
		)}: ${context.delegates.map((wallet) => `${wallet.delegate.username} (${wallet.publicKey})`).join(", ")}`;

		expect(context.handlerProvider.registerHandlers).toBeCalled();
		expect(context.logger.info).toHaveBeenCalledWith(expectedInfoMessage);
	});

	it("Boot should skip logging when the service is already initialised", async (context) => {
		context.forgerService.register({ hosts: [mockHost] });
		context.client.getRound.mockReturnValueOnce({ delegates: context.delegates });
		(context.forgerService as any).initialized = true;

		await expect(context.forgerService.boot(context.delegates)).toResolve();
		expect(context.logger.info).not.toHaveBeenCalledWith(`Forger Manager started.`);
	});

	it("Boot should not log when there are no active delegates", async (context) => {
		context.forgerService.register({ hosts: [mockHost] });
		context.client.getRound.mockReturnValueOnce({ delegates: context.delegates });

		await expect(context.forgerService.boot([])).toResolve();
		expect(context.logger.info).toHaveBeenCalledTimes(1);
		expect(context.logger.info).toHaveBeenCalledWith(`Forger Manager started.`);
	});

	it("Boot should log inactive delegates correctly", async (context) => {
		const numberActive = 10;

		const round = { data: { delegates: context.delegates.slice(0, numberActive) } };

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

		const expectedInactiveDelegatesMessage = `Loaded ${Utils.pluralize(
			"inactive delegate",
			context.delegates.length - numberActive,
			true,
		)}: ${context.delegates
			.slice(numberActive)
			.map((delegate) => delegate.publicKey)
			.join(", ")}`;

		context.forgerService.register({ hosts: [mockHost] });
		await expect(context.forgerService.boot(context.delegates)).toResolve();

		expect(context.logger.info).toHaveBeenCalledWith(expectedInactiveDelegatesMessage);
	});

	it("Boot should catch and log errors", async (context) => {
		context.client.getRound.mockRejectedValueOnce(new Error("oops"));

		context.forgerService.register({ hosts: [mockHost] });
		await expect(context.forgerService.boot(context.delegates)).toResolve();

		expect(context.logger.warning).toHaveBeenCalledWith(`Waiting for a responsive host`);
	});

	it("Boot should set correct timeout to check slots", async (context) => {
		jest.useFakeTimers();

		context.client.getRound.mockReturnValueOnce({
			delegates: context.delegates,
			timestamp: Crypto.Slots.getTime() - 7,
			lastBlock: { height: 100 },
		});

		context.forgerService.register({ hosts: [mockHost] });
		await expect(context.forgerService.boot(context.delegates)).toResolve();

		jest.runAllTimers();

		expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), expect.toBeWithin(0, 2000));
	});

	it("GetTransactionsForForging should log error when transactions are empty", async (context) => {
		context.forgerService.register({ hosts: [mockHost] });

		// @ts-ignore
		const spyGetTransactions = jest.spyOn(context.forgerService.client, "getTransactions");
		// @ts-ignore
		spyGetTransactions.mockResolvedValue([]);
		await expect(context.forgerService.getTransactionsForForging()).resolves.toEqual([]);
		expect(context.logger.error).toHaveBeenCalledWith(
			`Could not get unconfirmed transactions from transaction pool.`,
		);
	});

	it("GetTransactionsForForging should log and return valid transactions", async (context) => {
		context.forgerService.register({ hosts: [mockHost] });

		// @ts-ignore
		const spyGetTransactions = jest.spyOn(context.forgerService.client, "getTransactions");

		const recipientAddress = Identities.Address.fromPassphrase("recipient's secret");
		const transaction = Transactions.BuilderFactory.transfer()
			.version(1)
			.amount("100")
			.recipientId(recipientAddress)
			.sign("sender's secret")
			.build();

		const mockTransaction = {
			transactions: [transaction.serialized.toString("hex")],
			poolSize: 10,
			count: 10,
		};
		// @ts-ignore
		spyGetTransactions.mockResolvedValue(mockTransaction);
		await expect(context.forgerService.getTransactionsForForging()).resolves.toEqual([transaction.data]);
		expect(context.logger.error).not.toHaveBeenCalled();
		const expectedLogInfo =
			`Received ${Utils.pluralize("transaction", 1, true)} ` +
			`from the pool containing ${Utils.pluralize("transaction", mockTransaction.poolSize, true)} total`;
		expect(context.logger.debug).toHaveBeenCalledWith(expectedLogInfo);
	});

	it("isForgingAllowed should not allow forging when network status is unknown", async (context) => {
		expect(
			// @ts-ignore
			context.forgerService.isForgingAllowed({ status: NetworkStateStatus.Unknown }, delegates[0]),
		).toEqual(false);
		expect(context.logger.info).toHaveBeenCalledWith(
			"Failed to get network state from context.client. Will not forge.",
		);
	});

	it("isForgingAllowed should not allow forging when network status is a cold start", async (context) => {
		expect(
			// @ts-ignore
			context.forgerService.isForgingAllowed({ status: NetworkStateStatus.ColdStart }, delegates[0]),
		).toEqual(false);
		expect(context.logger.info).toHaveBeenCalledWith("Skipping slot because of cold start. Will not forge.");
	});

	it("isForgingAllowed should not allow forging when network status is below minimum peers", async (context) => {
		expect(
			// @ts-ignore
			context.forgerService.isForgingAllowed({ status: NetworkStateStatus.BelowMinimumPeers }, delegates[0]),
		).toEqual(false);
		expect(context.logger.info).toHaveBeenCalledWith(
			"Network reach is not sufficient to get quorum. Will not forge.",
		);
	});

	it("isForgingAllowed should log double forge warning for any overheight block headers", async (context) => {
		context.client.getRound.mockReturnValueOnce({ delegates: context.delegates });
		context.forgerService.register({ hosts: [mockHost] });
		await context.forgerService.boot(context.delegates);

		const overHeightBlockHeaders: Array<{
			[id: string]: any;
		}> = [
			{
				generatorPublicKey: context.delegates[0].publicKey,
				id: 1,
			},
		];

		context.mockNetworkState.getQuorum = () => 0.99;
		context.mockNetworkState.getOverHeightBlockHeaders = () => overHeightBlockHeaders;

		expect(
			// @ts-ignore
			context.forgerService.isForgingAllowed(mockNetworkState, delegates[0]),
		).toEqual(true);
		const expectedOverHeightInfo = `Detected ${Utils.pluralize(
			"distinct overheight block header",
			overHeightBlockHeaders.length,
			true,
		)}.`;
		expect(context.logger.info).toHaveBeenCalledWith(expectedOverHeightInfo);

		const expectedDoubleForgeWarning = `Possible double forging delegate: ${context.delegates[0].delegate.username} (${context.delegates[0].publicKey}) - Block: ${overHeightBlockHeaders[0].id}.`;

		expect(context.logger.warning).toHaveBeenCalledWith(expectedDoubleForgeWarning);
	});

	it("isForgingAllowed should not allow forging if quorum is not met", async (context) => {
		jest.useFakeTimers();

		context.client.getRound.mockReturnValueOnce({
			delegates: context.delegates,
			timestamp: Crypto.Slots.getTime() - 7,
			lastBlock: { height: 100 },
		});

		context.forgerService.register({ hosts: [mockHost] });
		await context.forgerService.boot(context.delegates);

		(context.mockNetworkState.getQuorum = () => 0.6),
			expect(
				// @ts-ignore
				context.forgerService.isForgingAllowed(context.mockNetworkState, delegates[0]),
			).toEqual(false);

		expect(context.logger.info).toHaveBeenCalledWith("Not enough quorum to forge next block. Will not forge.");

		expect(context.logger.debug).toHaveBeenCalledWith(`Network State: ${context.mockNetworkState.toJson()}`);

		expect(context.logger.warning).not.toHaveBeenCalled();
	});

	it("isForgingAllowed should allow forging if quorum is met", async (context) => {
		context.client.getRound.mockReturnValueOnce({
			delegates: context.delegates,
			timestamp: Crypto.Slots.getTime() - 7,
			lastBlock: { height: 100 },
		});

		context.forgerService.register({ hosts: [mockHost] });
		await context.forgerService.boot(context.delegates);

		expect(
			// @ts-ignore
			context.forgerService.isForgingAllowed(context.mockNetworkState, delegates[0]),
		).toEqual(true);

		expect(context.logger.debug).not.toHaveBeenCalled();

		expect(context.logger.warning).not.toHaveBeenCalled();
	});

	it("isForgingAllowed should allow forging if quorum is met, not log warning if overheight delegate is not the same", async (context) => {
		context.client.getRound.mockReturnValueOnce({
			delegates: context.delegates,
			timestamp: Crypto.Slots.getTime() - 7,
			lastBlock: { height: 100 },
		});

		context.forgerService.register({ hosts: [mockHost] });
		await context.forgerService.boot(context.delegates);

		const overHeightBlockHeaders: Array<{
			[id: string]: any;
		}> = [
			{
				generatorPublicKey: context.delegates[0].publicKey,
				id: 1,
			},
		];

		context.mockNetworkState.getOverHeightBlockHeaders = () => overHeightBlockHeaders;

		expect(
			// @ts-ignore
			context.forgerService.isForgingAllowed(context.mockNetworkState, delegates[1]),
		).toEqual(true);

		expect(context.logger.debug).not.toHaveBeenCalled();

		expect(context.logger.warning).not.toHaveBeenCalled();
	});

	it("checkSlot should do nothing when the forging service is stopped", async (context) => {
		context.forgerService.register({ hosts: [mockHost] });

		await context.forgerService.dispose();

		await expect(context.forgerService.checkSlot()).toResolve();

		expect(context.logger.info).not.toHaveBeenCalled();
		expect(context.logger.warning).not.toHaveBeenCalled();
		expect(context.logger.error).not.toHaveBeenCalled();
		expect(context.logger.debug).not.toHaveBeenCalled();
	});

	it("checkSlot should set timer if forging is not yet allowed", async (context) => {
		context.forgerService.register({ hosts: [mockHost] });
		(context.forgerService as any).initialized = true;

		context.client.getRound.mockReturnValueOnce({
			delegates: context.delegates,
			timestamp: Crypto.Slots.getTime() - 7,
			lastBlock: { height: 100 },
		});
		await expect(context.forgerService.boot(context.delegates)).toResolve();
		expect(context.logger.info).not.toHaveBeenCalledWith(`Forger Manager started.`);

		jest.useFakeTimers();

		context.client.getRound.mockReturnValueOnce({
			delegates: context.delegates,
			timestamp: Crypto.Slots.getTime() - 7,
			lastBlock: { height: 100 },
		});
		await expect(context.forgerService.checkSlot()).toResolve();
		expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 200);

		expect(context.logger.info).not.toHaveBeenCalled();
		expect(context.logger.warning).not.toHaveBeenCalled();
		expect(context.logger.error).not.toHaveBeenCalled();
		expect(context.logger.debug).not.toHaveBeenCalled();

		jest.useRealTimers();
	});

	it("checkSlot should set timer and log nextForger which is active on node", async (context) => {
		const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		slotSpy.mockReturnValue(0);

		const round = {
			data: {
				delegates: context.delegates,
				canForge: true,
				currentForger: {
					publicKey: context.delegates[context.delegates.length - 1].publicKey,
				},
				nextForger: { publicKey: context.delegates[context.delegates.length - 3].publicKey },
				timestamp: Crypto.Slots.getTime() - 7,
				lastBlock: { height: 100 },
			},
		};

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

		context.forgerService.register({ hosts: [mockHost] });
		(context.forgerService as any).initialized = true;

		await expect(context.forgerService.boot(context.delegates.slice(0, context.delegates.length - 2))).toResolve();
		expect(context.logger.info).not.toHaveBeenCalledWith(`Forger Manager started.`);

		jest.useFakeTimers();
		// @ts-ignore
		const spyClientSyncWithNetwork = jest.spyOn(context.forgerService.client, "syncWithNetwork");

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
		await expect(context.forgerService.checkSlot()).toResolve();

		expect(spyClientSyncWithNetwork).toHaveBeenCalled();

		const expectedInfoMessage = `Next forging delegate ${
			context.delegates[context.delegates.length - 3].delegate.username
		} (${context.delegates[context.delegates.length - 3].publicKey}) is active on this node.`;

		expect(context.logger.info).toHaveBeenCalledWith(expectedInfoMessage);
		expect(context.logger.warning).not.toHaveBeenCalled();
		expect(context.logger.error).not.toHaveBeenCalled();

		jest.useRealTimers();
	});

	it("checkSlot should set timer and not log message if nextForger is not active", async (context) => {
		const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		slotSpy.mockReturnValue(0);

		const round = {
			data: {
				delegates: context.delegates,
				canForge: true,
				currentForger: {
					publicKey: context.delegates[context.delegates.length - 2].publicKey,
				},
				nextForger: { publicKey: context.delegates[context.delegates.length - 1].publicKey },
				timestamp: Crypto.Slots.getTime() - 7,
				lastBlock: { height: 100 },
			},
		};

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

		context.forgerService.register({ hosts: [mockHost] });
		(context.forgerService as any).initialized = true;

		await expect(context.forgerService.boot(context.delegates.slice(0, context.delegates.length - 3))).toResolve();
		expect(context.logger.info).not.toHaveBeenCalledWith(`Forger Manager started.`);

		jest.useFakeTimers();
		// @ts-ignore
		const spyClientSyncWithNetwork = jest.spyOn(context.forgerService.client, "syncWithNetwork");
		spyClientSyncWithNetwork.mockReset();

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
		await expect(context.forgerService.checkSlot()).toResolve();

		expect(spyClientSyncWithNetwork).not.toHaveBeenCalled();

		const expectedInfoMessage = `Next forging delegate ${
			context.delegates[context.delegates.length - 3].delegate.username
		} (${context.delegates[context.delegates.length - 3].publicKey}) is active on this node.`;

		expect(context.logger.info).not.toHaveBeenCalledWith(expectedInfoMessage);
		expect(context.logger.warning).not.toHaveBeenCalled();
		expect(context.logger.error).not.toHaveBeenCalled();
		expect(context.logger.debug).not.toHaveBeenCalledWith(
			`Sending wake-up check to relay node ${mockHost.hostname}`,
		);

		jest.useRealTimers();
	});

	it("checkSlot should forge valid blocks when forging is allowed", async (context) => {
		const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		slotSpy.mockReturnValue(0);

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};
		context.delegates[context.delegates.length - 2] = Object.assign(
			nextDelegateToForge,
			context.delegates[context.delegates.length - 2],
		);

		const round = {
			data: {
				delegates: context.delegates,
				canForge: true,
				currentForger: {
					publicKey: context.delegates[context.delegates.length - 2].publicKey,
				},
				nextForger: { publicKey: context.delegates[context.delegates.length - 3].publicKey },
				lastBlock: {
					height: 3,
				},
				timestamp: Crypto.Slots.getTime() - 7,
				reward: "0",
				current: 1,
			},
		};

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

		context.forgerService.register({ hosts: [mockHost] });

		// @ts-ignore
		const spyGetTransactions = jest.spyOn(context.forgerService.client, "getTransactions");
		// @ts-ignore
		spyGetTransactions.mockResolvedValue([]);

		const spyForgeNewBlock = jest.spyOn(context.forgerService, "forgeNewBlock");

		// @ts-ignore
		const spyGetNetworkState = jest.spyOn(context.forgerService.client, "getNetworkState");
		// @ts-ignore
		spyGetNetworkState.mockResolvedValue(context.mockNetworkState);

		await expect(context.forgerService.boot(context.delegates)).toResolve();

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
		jest.useFakeTimers();
		// @ts-ignore
		await expect(context.forgerService.checkSlot()).toResolve();

		expect(spyForgeNewBlock).toHaveBeenCalledWith(
			context.delegates[context.delegates.length - 2],
			round.data,
			context.mockNetworkState,
		);

		const loggerWarningMessage = `The NetworkState height (${context.mockNetworkState.getNodeHeight()}) and round height (${
			round.data.lastBlock.height
		}) are out of sync. This indicates delayed blocks on the network.`;
		expect(context.logger.warning).toHaveBeenCalledWith(loggerWarningMessage);

		jest.useRealTimers();
	});

	it("checkSlot should not log warning message when nodeHeight does not equal last block height", async (context) => {
		const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		slotSpy.mockReturnValue(0);

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};
		context.delegates[context.delegates.length - 2] = Object.assign(
			nextDelegateToForge,
			context.delegates[context.delegates.length - 2],
		);

		const round = {
			data: {
				delegates: context.delegates,
				canForge: true,
				currentForger: {
					publicKey: context.delegates[context.delegates.length - 2].publicKey,
				},
				nextForger: { publicKey: context.delegates[context.delegates.length - 3].publicKey },
				lastBlock: {
					height: 10,
				},
				timestamp: Crypto.Slots.getTime() - 7,
				reward: "0",
			},
		};

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

		context.forgerService.register({ hosts: [mockHost] });

		// @ts-ignore
		const spyGetTransactions = jest.spyOn(context.forgerService.client, "getTransactions");
		// @ts-ignore
		spyGetTransactions.mockResolvedValue([]);

		const spyForgeNewBlock = jest.spyOn(context.forgerService, "forgeNewBlock");

		// @ts-ignore
		const spyGetNetworkState = jest.spyOn(context.forgerService.client, "getNetworkState");
		// @ts-ignore
		spyGetNetworkState.mockResolvedValue(context.mockNetworkState);

		await expect(context.forgerService.boot(context.delegates)).toResolve();

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
		jest.useFakeTimers();
		// @ts-ignore
		await context.forgerService.checkSlot();

		expect(spyForgeNewBlock).toHaveBeenCalledWith(
			context.delegates[context.delegates.length - 2],
			round.data,
			context.mockNetworkState,
		);

		const loggerWarningMessage = `The NetworkState height (${context.mockNetworkState.nodeHeight}) and round height (${round.data.lastBlock.height}) are out of sync. This indicates delayed blocks on the network.`;
		expect(context.logger.warning).not.toHaveBeenCalledWith(loggerWarningMessage);

		jest.useRealTimers();
	});

	it("checkSlot should not allow forging when blocked by network status", async (context) => {
		const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		slotSpy.mockReturnValue(0);

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};
		context.delegates[context.delegates.length - 2] = Object.assign(
			nextDelegateToForge,
			context.delegates[context.delegates.length - 2],
		);

		const round = {
			data: {
				delegates: context.delegates,
				canForge: true,
				currentForger: {
					publicKey: context.delegates[context.delegates.length - 2].publicKey,
				},
				nextForger: { publicKey: context.delegates[context.delegates.length - 3].publicKey },
				lastBlock: {
					height: 10,
				},
				timestamp: 0,
				reward: "0",
			},
		};

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

		context.forgerService.register({ hosts: [mockHost] });

		// @ts-ignore
		const spyGetTransactions = jest.spyOn(context.forgerService.client, "getTransactions");
		// @ts-ignore
		spyGetTransactions.mockResolvedValue([]);

		const spyForgeNewBlock = jest.spyOn(context.forgerService, "forgeNewBlock");

		context.mockNetworkState.status = NetworkStateStatus.Unknown;

		// @ts-ignore
		const spyGetNetworkState = jest.spyOn(context.forgerService.client, "getNetworkState");
		// @ts-ignore
		spyGetNetworkState.mockResolvedValue(context.mockNetworkState);

		await expect(context.forgerService.boot(context.delegates)).toResolve();

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
		// @ts-ignore
		await expect(context.forgerService.checkSlot()).toResolve();

		expect(spyForgeNewBlock).not.toHaveBeenCalled();
	});

	it("checkSlot should catch network errors and set timeout to check slot later", async (context) => {
		const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		slotSpy.mockReturnValue(0);

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};
		context.delegates[context.delegates.length - 2] = Object.assign(
			nextDelegateToForge,
			context.delegates[context.delegates.length - 2],
		);

		const round = {
			data: {
				delegates: context.delegates,
				canForge: true,
				currentForger: {
					publicKey: context.delegates[context.delegates.length - 2].publicKey,
				},
				nextForger: { publicKey: context.delegates[context.delegates.length - 3].publicKey },
				lastBlock: {
					height: 10,
				},
				timestamp: 0,
				reward: "0",
			},
		};

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

		context.forgerService.register({ hosts: [mockHost] });

		// @ts-ignore
		const spyGetTransactions = jest.spyOn(context.forgerService.client, "getTransactions");
		// @ts-ignore
		spyGetTransactions.mockResolvedValue([]);

		const spyForgeNewBlock = jest.spyOn(context.forgerService, "forgeNewBlock");

		// @ts-ignore
		const spyGetNetworkState = jest.spyOn(context.forgerService.client, "getNetworkState");
		// @ts-ignore
		spyGetNetworkState.mockImplementation(() => {
			throw new HostNoResponseError(`blockchain isn't ready`);
		});

		await expect(context.forgerService.boot(context.delegates)).toResolve();

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
		jest.useFakeTimers();
		// @ts-ignore
		await expect(context.forgerService.checkSlot()).toResolve();

		expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

		expect(spyForgeNewBlock).not.toHaveBeenCalled();

		expect(context.logger.info).toHaveBeenCalledWith(`Waiting for relay to become ready.`);

		jest.useRealTimers();
	});

	it("checkSlot should log warning when error isn't a network error", async (context) => {
		const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		slotSpy.mockReturnValue(0);

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};
		context.delegates[context.delegates.length - 2] = Object.assign(
			nextDelegateToForge,
			context.delegates[context.delegates.length - 2],
		);

		const round = {
			data: {
				delegates: context.delegates,
				canForge: true,
				currentForger: {
					publicKey: context.delegates[context.delegates.length - 2].publicKey,
				},
				nextForger: { publicKey: context.delegates[context.delegates.length - 3].publicKey },
				lastBlock: {
					height: 10,
				},
				timestamp: 0,
				reward: "0",
			},
		};

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

		context.forgerService.register({ hosts: [mockHost] });

		// @ts-ignore
		const spyGetTransactions = jest.spyOn(context.forgerService.client, "getTransactions");
		// @ts-ignore
		spyGetTransactions.mockResolvedValue([]);

		const spyForgeNewBlock = jest.spyOn(context.forgerService, "forgeNewBlock");

		// @ts-ignore
		const spyGetNetworkState = jest.spyOn(context.forgerService.client, "getNetworkState");
		const mockEndpoint = `Test - Endpoint`;
		const mockError = `custom error`;
		// @ts-ignore
		spyGetNetworkState.mockImplementation(() => {
			throw new RelayCommunicationError(mockEndpoint, mockError);
		});

		await expect(context.forgerService.boot(context.delegates)).toResolve();

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
		jest.useFakeTimers();
		// @ts-ignore
		await expect(context.forgerService.checkSlot()).toResolve();

		expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

		expect(spyForgeNewBlock).not.toHaveBeenCalled();

		expect(context.logger.warning).toHaveBeenCalledWith(
			`Request to ${mockEndpoint} failed, because of '${mockError}'.`,
		);

		jest.useRealTimers();
	});

	it("checkSlot should log error when error thrown during attempted forge isn't a network error", async (context) => {
		const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		slotSpy.mockReturnValue(0);

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};
		context.delegates[context.delegates.length - 2] = Object.assign(
			nextDelegateToForge,
			context.delegates[context.delegates.length - 2],
		);

		const round = {
			data: {
				delegates: context.delegates,
				canForge: true,
				currentForger: {
					publicKey: context.delegates[context.delegates.length - 2].publicKey,
				},
				nextForger: { publicKey: context.delegates[context.delegates.length - 3].publicKey },
				lastBlock: {
					height: 10,
				},
				timestamp: 0,
				reward: "0",
				current: 9,
			},
		};

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

		context.forgerService.register({ hosts: [mockHost] });

		// @ts-ignore
		const spyGetTransactions = jest.spyOn(context.forgerService.client, "getTransactions");
		// @ts-ignore
		spyGetTransactions.mockResolvedValue([]);

		// @ts-ignore
		const spyClientEmitEvent = jest.spyOn(context.forgerService.client, "emitEvent");

		const spyForgeNewBlock = jest.spyOn(context.forgerService, "forgeNewBlock");

		// @ts-ignore
		const spyGetNetworkState = jest.spyOn(context.forgerService.client, "getNetworkState");
		const mockError = `custom error`;
		// @ts-ignore
		spyGetNetworkState.mockImplementation(() => {
			throw new Error(mockError);
		});

		await expect(context.forgerService.boot(context.delegates)).toResolve();

		context.client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
		jest.useFakeTimers();
		// @ts-ignore
		await expect(context.forgerService.checkSlot()).toResolve();

		expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

		expect(spyForgeNewBlock).not.toHaveBeenCalled();

		expect(context.logger.error).toHaveBeenCalled();

		expect(spyClientEmitEvent).toHaveBeenCalledWith(Enums.ForgerEvent.Failed, { error: mockError });
		const infoMessage = `Round: ${round.data.current.toLocaleString()}, height: ${round.data.lastBlock.height.toLocaleString()}`;
		expect(context.logger.info).toHaveBeenCalledWith(infoMessage);

		jest.useRealTimers();
	});

	it("checkSlot should not error when there is no round info", async (context) => {
		const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		slotSpy.mockReturnValue(0);

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};
		context.delegates[context.delegates.length - 2] = Object.assign(
			nextDelegateToForge,
			context.delegates[context.delegates.length - 2],
		);

		const round = undefined;

		context.client.getRound.mockResolvedValueOnce(round as Contracts.P2P.CurrentRound);

		context.forgerService.register({ hosts: [mockHost] });

		// @ts-ignore
		const spyGetTransactions = jest.spyOn(context.forgerService.client, "getTransactions");
		// @ts-ignore
		spyGetTransactions.mockResolvedValue([]);

		// @ts-ignore
		const spyClientEmitEvent = jest.spyOn(context.forgerService.client, "emitEvent");

		const spyForgeNewBlock = jest.spyOn(context.forgerService, "forgeNewBlock");

		await expect(context.forgerService.boot(context.delegates)).toResolve();

		context.client.getRound.mockResolvedValueOnce(round as Contracts.P2P.CurrentRound);
		jest.useFakeTimers();
		// @ts-ignore
		await expect(context.forgerService.checkSlot()).toResolve();

		expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

		expect(spyForgeNewBlock).not.toHaveBeenCalled();

		expect(context.logger.error).toHaveBeenCalled();

		expect(spyClientEmitEvent).toHaveBeenCalledWith(Enums.ForgerEvent.Failed, { error: expect.any(String) });
		expect(context.logger.info).not.toHaveBeenCalled();

		jest.useRealTimers();
	});

	it("ForgeNewBlock should fail to forge when delegate is already in next slot", async (context) => {
		context.client.getRound.mockReturnValueOnce({
			delegates: context.delegates,
			timestamp: Crypto.Slots.getTime() - 7,
			lastBlock: { height: 100 },
		});

		context.forgerService.register({ hosts: [mockHost] });

		context.client.getTransactions.mockResolvedValueOnce(context.mockTransaction);

		await context.forgerService.boot(context.delegates);

		const address = `Delegate-Wallet-${2}`;

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const mockPrevRound = { ...context.mockRound, timestamp: Crypto.Slots.getTime() - 9 };
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};

		// @ts-ignore
		await expect(
			context.forgerService.forgeNewBlock(nextDelegateToForge, mockPrevRound, context.mockNetworkState),
		).toResolve();

		const prettyName = `Username: ${address} (${nextDelegateToForge.publicKey})`;

		const failedForgeMessage = `Failed to forge new block by delegate ${prettyName}, because already in next slot.`;

		expect(context.logger.warning).toHaveBeenCalledWith(failedForgeMessage);
	});

	it("ForgeNewBlock should fail to forge when there is not enough time left in slot", async (context) => {
		context.client.getRound.mockReturnValueOnce({
			delegates: context.delegates,
			timestamp: Crypto.Slots.getTime() - 7,
			lastBlock: { height: 100 },
		});

		context.forgerService.register({ hosts: [mockHost] });

		context.client.getTransactions.mockResolvedValueOnce(context.mockTransaction);

		await context.forgerService.boot(context.delegates);

		const address = `Delegate-Wallet-${2}`;

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const mockEndingRound = { ...context.mockRound, timestamp: Crypto.Slots.getTime() - 7 };
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};

		const spyNextSlot = jest.spyOn(Crypto.Slots, "getSlotNumber");
		spyNextSlot.mockReturnValue(0);

		// @ts-ignore
		await expect(
			context.forgerService.forgeNewBlock(nextDelegateToForge as any, mockEndingRound, context.mockNetworkState),
		).toResolve();

		const prettyName = `Username: ${address} (${nextDelegateToForge.publicKey})`;

		expect(context.logger.warning).toHaveBeenCalledWith(
			expect.stringContaining(`Failed to forge new block by delegate ${prettyName}, because there were`),
		);
	});

	it("ForgeNewBlock should forge valid new blocks", async (context) => {
		context.client.getRound.mockReturnValueOnce({ delegates: context.delegates });
		const timeLeftInMs = 3000;
		const spyTimeTillNextSlot = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
		spyTimeTillNextSlot.mockReturnValue(timeLeftInMs);

		context.forgerService.register({ hosts: [mockHost] });

		context.client.getTransactions.mockResolvedValueOnce(context.mockTransaction);

		await context.forgerService.boot(context.delegates);

		const address = `Delegate-Wallet-${2}`;

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};

		const spyNextSlot = jest.spyOn(Crypto.Slots, "getSlotNumber");
		spyNextSlot.mockReturnValue(0);

		context.client.emitEvent.mockReset();
		// @ts-ignore
		await expect(
			context.forgerService.forgeNewBlock(nextDelegateToForge, context.mockRound, context.mockNetworkState),
		).toResolve();

		const prettyName = `Username: ${address} (${nextDelegateToForge.publicKey})`;

		const infoForgeMessageOne = `Forged new block`;
		const infoForgeMessageTwo = ` by delegate ${prettyName}`;

		expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining(infoForgeMessageOne));
		expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining(infoForgeMessageTwo));

		expect(context.client.broadcastBlock).toHaveBeenCalledWith(mockBlock);

		expect(context.client.emitEvent).toHaveBeenNthCalledWith(1, Enums.BlockEvent.Forged, expect.anything());

		expect(context.client.emitEvent).toHaveBeenNthCalledWith(
			2,
			Enums.TransactionEvent.Forged,
			context.transaction.data,
		);
	});

	it("ForgeNewBlock should forge valid new blocks when passed specific milestones", async (context) => {
		context.client.getRound.mockReturnValueOnce({
			delegates: context.delegates,
			timestamp: Crypto.Slots.getTime() - 3,
			lastBlock: { height: 100 },
		});

		const spyMilestone = jest.spyOn(Managers.configManager, "getMilestone");
		spyMilestone.mockReturnValue({
			...Managers.configManager.getMilestone(1),
			block: { version: 0, idFullSha256: true },
		});

		context.forgerService.register({ hosts: [mockHost] });

		context.client.getTransactions.mockResolvedValueOnce(context.mockTransaction);

		context.mockNetworkState.lastBlockId = "c2fa2d400b4c823873d476f6e0c9e423cf925e9b48f1b5706c7e2771d4095538";

		jest.useFakeTimers();
		await context.forgerService.boot(context.delegates);

		const address = `Delegate-Wallet-${2}`;

		const mockBlock = { data: {} } as Interfaces.IBlock;
		const nextDelegateToForge = {
			publicKey: context.delegates[2].publicKey,
			forge: jest.fn().mockReturnValue(mockBlock),
		};

		const spyNextSlot = jest.spyOn(Crypto.Slots, "getSlotNumber");
		spyNextSlot.mockReturnValueOnce(0).mockReturnValueOnce(0);

		context.client.emitEvent.mockReset();
		// @ts-ignore
		await context.forgerService.forgeNewBlock(nextDelegateToForge, round.data, context.mockNetworkState);

		const prettyName = `Username: ${address} (${nextDelegateToForge.publicKey})`;

		const infoForgeMessageOne = `Forged new block`;
		const infoForgeMessageTwo = ` by delegate ${prettyName}`;

		expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining(infoForgeMessageOne));
		expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining(infoForgeMessageTwo));

		expect(context.client.broadcastBlock).toHaveBeenCalledWith(mockBlock);

		expect(context.client.emitEvent).toHaveBeenNthCalledWith(1, Enums.BlockEvent.Forged, expect.anything());

		expect(context.client.emitEvent).toHaveBeenNthCalledWith(
			2,
			Enums.TransactionEvent.Forged,
			context.transaction.data,
		);
		jest.useRealTimers();
	});
});
