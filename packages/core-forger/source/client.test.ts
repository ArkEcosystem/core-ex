import { Application, Container } from "@arkecosystem/core-kernel";
import { Codecs, Nes, NetworkStateStatus } from "@arkecosystem/core-p2p";

import { Client } from "./client";
import { describe } from "../../core-test-framework/source";
import { forgedBlockWithTransactions } from "../test/create-block-with-transactions";

import { nesClient } from "../test/mocks/nes";
import sinon from "sinon";

describe<{
	app: Application;
	client: Client;
	logger: any;
}>("Client", ({ assert, beforeEach, it, spy, spyFn, stub, stubFn }) => {
	const host = { hostname: "127.0.0.1", port: 4000, socket: undefined };
	const hostIPv6 = { hostname: "::1", port: 4000, socket: undefined };
	const hosts = [host];
	const hostsIPv6 = [hostIPv6];

	beforeEach((context) => {
		context.logger = {
			error: spyFn(),
			debug: spyFn(),
		};

		context.app = new Application(new Container.Container());
		context.app.bind(Container.Identifiers.LogService).toConstantValue(context.logger);

		context.client = context.app.resolve<Client>(Client);
	});

	it("register should register hosts", async (context) => {
		context.client.register(hosts);

		const expectedUrl = `ws://${host.hostname}:${host.port}`;
		const expectedOptions = { ws: { maxPayload: 20971520 } };

		assert.true(Nes.Client.calledWith(expectedUrl, expectedOptions));
		assert.equal(context.client.hosts, [{ ...host, socket: expect.anything() }]);
	});

	it("register should register IPv6 hosts", async (context) => {
		context.client.register(hostsIPv6);

		const expectedUrl = `ws://[${hostIPv6.hostname}]:${hostIPv6.port}`;
		const expectedOptions = { ws: { maxPayload: 20971520 } };

		expect(Nes.Client).toHaveBeenCalledWith(expectedUrl, expectedOptions);
		assert.equal(context.client.hosts, [{ ...hostIPv6, socket: expect.anything() }]);
	});

	it("register on error the socket should call logger", (context) => {
		context.client.register(hosts);

		const fakeError = { message: "Fake Error" };
		context.client.hosts[0].socket.onError(fakeError);

		assert.true(context.logger.error.calledWith("Fake Error"));
	});

	it("dispose should call disconnect on all sockets", (context) => {
		context.client.register([host, { hostname: "127.0.0.5", port: 4000 }]);
		context.client.dispose();

		assert.true(context.client.hosts[0].socket.disconnect.called);
		assert.true(context.client.hosts[1].socket.disconnect.called);
		assert.true(nesClient.disconnect.called);
	});

	it("broadcastBlock should log broadcast as debug message", async (context) => {
		context.client.register(hosts);

		await assert.resolves(() => context.client.broadcastBlock(forgedBlockWithTransactions));
		assert.true(
			context.logger.debug.calledWith(
				`Broadcasting block ${forgedBlockWithTransactions.data.height.toLocaleString()} (${
					forgedBlockWithTransactions.data.id
				}) with ${forgedBlockWithTransactions.data.numberOfTransactions} transactions to ${host.hostname}`,
			),
		);
	});

	it("broadcastBlock should not broadcast block when there is an issue with socket", async (context) => {
		context.client.register(hosts);

		host.socket = {};
		await assert.resolves(() => context.client.broadcastBlock(forgedBlockWithTransactions));

		assert.true(
			context.logger.error.calledWith(
				`Broadcast block failed: Request to ${host.hostname}:${host.port}<p2p.blocks.postBlock> failed, because of 'this.host.socket.request is not a function'.`,
			),
		);
	});

	it("broadcastBlock should broadcast valid blocks without error", async (context) => {
		context.client.register([host]);

		nesClient.request.returns({
			payload: Codecs.postBlock.response.serialize({ status: true, height: 100 }),
		});

		await assert.resolves(() => context.client.broadcastBlock(forgedBlockWithTransactions));

		assert.true(
			nesClient.request.calledWith({
				path: "p2p.blocks.postBlock",
				payload: sinon.match.instanceOf(Buffer),
			}),
		);

		assert.false(context.logger.error.calledOnce);
	});

	it("broadcastBlock should not broadcast blocks on socket.request error", async (context) => {
		context.client.register([host]);

		nesClient.request.rejects(new Error("oops"));

		await assert.resolves(() => context.client.broadcastBlock(forgedBlockWithTransactions));

		assert.true(
			context.logger.error.calledWith(
				`Broadcast block failed: Request to ${host.hostname}:${host.port}<p2p.blocks.postBlock> failed, because of 'oops'.`,
			),
		);
	});

	it("selectHost should select the first open socket", async (context) => {
		let hosts = [host, host, host, host, host, host, host, host, host, host];
		hosts[4].socket._isReady = () => true;

		context.client.register(hosts);
		context.client.selectHost();
		assert.equal((context.client as any).host, hosts[4]);
	});

	it("selectHost should log debug message when no sockets are open", async (context) => {
		let hosts = [host, host, host, host, host, host, host, host, host, host];
		hosts.forEach((host) => {
			host.socket._isReady = () => false;
		});

		context.client.register(hosts);

		await assert.rejects(
			() => context.client.selectHost(),
			`${hosts.map((host) => host.hostname).join()} didn't respond. Trying again later.`,
		);
		assert.true(
			context.logger.debug.calledWith(
				`No open socket connection to any host: ${JSON.stringify(
					hosts.map((host) => `${host.hostname}:${host.port}`),
				)}.`,
			),
		);
	});

	it("getTransactions should call p2p.internal.getUnconfirmedTransactions endpoint", async (context) => {
		context.client.register([host]);
		await context.client.getTransactions();
		assert.true(
			nesClient.request.calledWith({
				path: "p2p.internal.getUnconfirmedTransactions",
				payload: Buffer.from(JSON.stringify({})),
			}),
		);
	});

	it("getRound should broadcast internal getRound transaction", async (context) => {
		context.client.register([host]);
		host.socket._isReady = () => true;

		await context.client.getRound();

		assert.true(
			nesClient.request.calledWith({
				path: "p2p.internal.getCurrentRound",
				payload: Buffer.from(JSON.stringify({})),
			}),
		);
	});

	it("syncWithNetwork should broadcast internal getRound transaction", async (context) => {
		context.client.register([host]);
		host.socket._isReady = () => true;
		await context.client.syncWithNetwork();

		assert.true(
			nesClient.request.calledWith({
				path: "p2p.internal.syncBlockchain",
				payload: Buffer.from(JSON.stringify({})),
			}),
		);
		assert.true(context.logger.debug.calledWith(`Sending wake-up check to relay node ${host.hostname}`));
	});

	it("syncWithNetwork should log error message if syncing fails", async (context) => {
		const errorMessage = "Fake Error";
		nesClient.request.returns(new Error(errorMessage));
		host.socket._isReady = () => true;
		context.client.register([host]);

		await assert.resolves(() => context.client.syncWithNetwork());

		assert.true(
			context.logger.error.calledWith(
				`Could not sync check: Request to 127.0.0.1:4000<p2p.internal.syncBlockchain> failed, because of '${errorMessage}'.`,
			),
		);
	});

	it("getNetworkState should emit internal getNetworkState event", async (context) => {
		context.client.register([host]);
		await context.client.getNetworkState();

		assert.true(
			nesClient.request.calledWith({
				path: "p2p.internal.getNetworkState",
				payload: Buffer.from(JSON.stringify({})),
			}),
		);
	});

	it("getNetworkState should return valid network state on error", async (context) => {
		const errorMessage = "Fake Error";
		nesClient.request.rejects(new Error(errorMessage));

		context.client.register([host]);
		const networkState = await context.client.getNetworkState();

		assert.equal(networkState.status, NetworkStateStatus.Unknown);
	});

	it("emitEvent should emit events from localhost", async (context) => {
		host.hostname = "127.0.0.1";
		context.client.register([host]);

		const data = { activeDelegates: ["delegate-one"] };

		await context.client.emitEvent("test-event", data);

		assert.true(
			nesClient.request.calledWith({
				path: "p2p.internal.emitEvent",
				payload: Buffer.from(
					JSON.stringify({
						event: "test-event",
						body: data,
					}),
				),
			}),
		);
	});

	it("emitEvent should not emit events which are not from localhost", async (context) => {
		host.hostname = "127.0.0.2";
		context.client.register([host]);

		const data = { activeDelegates: ["delegate-one"] };
		await context.client.emitEvent("test-event", data);

		assert.true(context.logger.error.calledWith("emitEvent: unable to find any local hosts."));
	});

	it("emitEvent should log error if emitting fails", async (context) => {
		const errorMessage = "Fake Error";
		nesClient.request.rejects(new Error(errorMessage));

		host.hostname = "127.0.0.1";
		context.client.register([host]);

		const event = "test-event";
		const data = { activeDelegates: ["delegate-one"] };
		await context.client.emitEvent(event, data);

		assert.true(context.logger.error.calledWith(`Failed to emit "${event}" to "${host.hostname}:${host.port}"`));
	});
});
