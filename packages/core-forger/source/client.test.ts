import { Application, Container } from "@arkecosystem/core-kernel";
import { Codecs, Nes, NetworkStateStatus } from "@arkecosystem/core-p2p";

import { Client } from "./client";
import { describe } from "../../core-test-framework/source";
import { forgedBlockWithTransactions } from "../test/create-block-with-transactions";

import { nesClient } from "../test/mocks/nes";

jest.spyOn(Nes, "Client").mockImplementation((url) => nesClient as any);

let app: Application;
const logger = {
	error: jest.fn(),
	debug: jest.fn(),
};

describe("Client", ({ assert, beforeEach, it, spy, spyFn, stub, stubFn }) => {
	let client: Client;

	const host = { hostname: "127.0.0.1", port: 4000, socket: undefined };
	const hostIPv6 = { hostname: "::1", port: 4000, socket: undefined };
	const hosts = [host];
	const hostsIPv6 = [hostIPv6];

	beforeEach((context) => {
		app = new Application(new Container.Container());
		app.bind(Container.Identifiers.LogService).toConstantValue(logger);

		client = app.resolve<Client>(Client);

		logger.error.mockReset();
		logger.debug.mockReset();
	});

	it("register should register hosts", async () => {
		client.register(hosts);

		const expectedUrl = `ws://${host.hostname}:${host.port}`;
		const expectedOptions = { ws: { maxPayload: 20971520 } };

		expect(Nes.Client).toHaveBeenCalledWith(expectedUrl, expectedOptions);
		expect(client.hosts).toEqual([{ ...host, socket: expect.anything() }]);
	});

	it("register should register IPv6 hosts", async () => {
		client.register(hostsIPv6);

		const expectedUrl = `ws://[${hostIPv6.hostname}]:${hostIPv6.port}`;
		const expectedOptions = { ws: { maxPayload: 20971520 } };

		expect(Nes.Client).toHaveBeenCalledWith(expectedUrl, expectedOptions);
		expect(client.hosts).toEqual([{ ...hostIPv6, socket: expect.anything() }]);
	});

	it("register on error the socket should call logger", () => {
		client.register(hosts);

		const fakeError = { message: "Fake Error" };
		client.hosts[0].socket.onError(fakeError);

		expect(logger.error).toHaveBeenCalledWith("Fake Error");
	});

	it("dispose should call disconnect on all sockets", () => {
		client.register([host, { hostname: "127.0.0.5", port: 4000 }]);
		client.dispose();
		expect(client.hosts[0].socket.disconnect).toHaveBeenCalled();
		expect(client.hosts[1].socket.disconnect).toHaveBeenCalled();
		expect(nesClient.disconnect).toBeCalled();
	});

	it("broadcastBlock should log broadcast as debug message", async () => {
		client.register(hosts);

		await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
		expect(logger.debug).toHaveBeenCalledWith(
			`Broadcasting block ${forgedBlockWithTransactions.data.height.toLocaleString()} (${
				forgedBlockWithTransactions.data.id
			}) with ${forgedBlockWithTransactions.data.numberOfTransactions} transactions to ${host.hostname}`,
		);
	});

	it("broadcastBlock should not broadcast block when there is an issue with socket", async () => {
		client.register(hosts);

		host.socket = {};
		await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();

		expect(logger.error).toHaveBeenCalledWith(
			`Broadcast block failed: Request to ${host.hostname}:${host.port}<p2p.blocks.postBlock> failed, because of 'this.host.socket.request is not a function'.`,
		);
	});

	it("broadcastBlock should broadcast valid blocks without error", async () => {
		client.register([host]);

		nesClient.request.mockResolvedValueOnce({
			payload: Codecs.postBlock.response.serialize({ status: true, height: 100 }),
		});

		await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();

		expect(nesClient.request).toHaveBeenCalledWith({
			path: "p2p.blocks.postBlock",
			payload: expect.any(Buffer),
		});

		expect(logger.error).not.toHaveBeenCalled();
	});

	it("broadcastBlock should not broadcast blocks on socket.request error", async () => {
		client.register([host]);

		nesClient.request.mockRejectedValueOnce(new Error("oops"));

		await expect(client.broadcastBlock(forgedBlockWithTransactions)).toResolve();
		expect(logger.error).toHaveBeenCalledWith(
			`Broadcast block failed: Request to ${host.hostname}:${host.port}<p2p.blocks.postBlock> failed, because of 'oops'.`,
		);
	});

	it("selectHost should select the first open socket", async () => {
		let hosts = [host, host, host, host, host, host, host, host, host, host];
		hosts[4].socket._isReady = () => true;

		client.register(hosts);
		client.selectHost();
		expect((client as any).host).toEqual(hosts[4]);
	});

	it("selectHost should log debug message when no sockets are open", async () => {
		let hosts = [host, host, host, host, host, host, host, host, host, host];
		hosts.forEach((host) => {
			host.socket._isReady = () => false;
		});

		client.register(hosts);
		await expect(client.selectHost()).rejects.toThrow(
			`${hosts.map((host) => host.hostname).join()} didn't respond. Trying again later.`,
		);
		expect(logger.debug).toHaveBeenCalledWith(
			`No open socket connection to any host: ${JSON.stringify(
				hosts.map((host) => `${host.hostname}:${host.port}`),
			)}.`,
		);
	});

	it("getTransactions should call p2p.internal.getUnconfirmedTransactions endpoint", async () => {
		client.register([host]);
		await client.getTransactions();
		expect(nesClient.request).toHaveBeenCalledWith({
			path: "p2p.internal.getUnconfirmedTransactions",
			payload: Buffer.from(JSON.stringify({})),
		});
	});

	it("getRound should broadcast internal getRound transaction", async () => {
		client.register([host]);
		host.socket._isReady = () => true;

		await client.getRound();

		expect(nesClient.request).toHaveBeenCalledWith({
			path: "p2p.internal.getCurrentRound",
			payload: Buffer.from(JSON.stringify({})),
		});
	});

	it("syncWithNetwork should broadcast internal getRound transaction", async () => {
		client.register([host]);
		host.socket._isReady = () => true;
		await client.syncWithNetwork();

		expect(nesClient.request).toHaveBeenCalledWith({
			path: "p2p.internal.syncBlockchain",
			payload: Buffer.from(JSON.stringify({})),
		});
		expect(logger.debug).toHaveBeenCalledWith(`Sending wake-up check to relay node ${host.hostname}`);
	});

	it("syncWithNetwork should log error message if syncing fails", async () => {
		const errorMessage = "Fake Error";
		nesClient.request.mockRejectedValueOnce(new Error(errorMessage));
		host.socket._isReady = () => true;
		client.register([host]);
		await expect(client.syncWithNetwork()).toResolve();
		expect(logger.error).toHaveBeenCalledWith(
			`Could not sync check: Request to 127.0.0.1:4000<p2p.internal.syncBlockchain> failed, because of '${errorMessage}'.`,
		);
	});

	it("getNetworkState should emit internal getNetworkState event", async () => {
		client.register([host]);
		await client.getNetworkState();

		expect(nesClient.request).toHaveBeenCalledWith({
			path: "p2p.internal.getNetworkState",
			payload: Buffer.from(JSON.stringify({})),
		});
	});

	it("getNetworkState should return valid network state on error", async () => {
		const errorMessage = "Fake Error";
		nesClient.request.mockRejectedValueOnce(new Error(errorMessage));

		client.register([host]);
		const networkState = await client.getNetworkState();

		expect(networkState.status).toEqual(NetworkStateStatus.Unknown);
	});

	it("emitEvent should emit events from localhost", async () => {
		host.hostname = "127.0.0.1";
		client.register([host]);

		const data = { activeDelegates: ["delegate-one"] };

		await client.emitEvent("test-event", data);

		expect(nesClient.request).toHaveBeenCalledWith({
			path: "p2p.internal.emitEvent",
			payload: Buffer.from(
				JSON.stringify({
					event: "test-event",
					body: data,
				}),
			),
		});
	});

	it("emitEvent should not emit events which are not from localhost", async () => {
		host.hostname = "127.0.0.2";
		client.register([host]);

		const data = { activeDelegates: ["delegate-one"] };
		await client.emitEvent("test-event", data);

		expect(logger.error).toHaveBeenCalledWith("emitEvent: unable to find any local hosts.");
	});

	it("emitEvent should log error if emitting fails", async () => {
		const errorMessage = "Fake Error";
		nesClient.request.mockRejectedValueOnce(new Error(errorMessage));

		host.hostname = "127.0.0.1";
		client.register([host]);

		const event = "test-event";
		const data = { activeDelegates: ["delegate-one"] };
		await client.emitEvent(event, data);

		expect(logger.error).toHaveBeenCalledWith(`Failed to emit "${event}" to "${host.hostname}:${host.port}"`);
	});
});
