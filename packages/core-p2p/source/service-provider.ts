import { Identifiers } from "@arkecosystem/core-contracts";
import { Providers, Services } from "@arkecosystem/core-kernel";
import Joi from "joi";

import { ValidateAndAcceptPeerAction } from "./actions";
import { ChunkCache } from "./chunk-cache";
import { EventListener } from "./event-listener";
import { NetworkMonitor } from "./network-monitor";
import { Peer } from "./peer";
import { PeerCommunicator } from "./peer-communicator";
import { PeerConnector } from "./peer-connector";
import { PeerProcessor } from "./peer-processor";
import { PeerRepository } from "./peer-repository";
import { ResponseHandler } from "./server/contracts";
import { GetCommonBlocksHandler } from "./server/handlers/common-blocks";
import { GetBlocksHandler } from "./server/handlers/get-blocks";
import { GetPeerStatusHandler } from "./server/handlers/peer-status";
import { PostBlockHandler } from "./server/handlers/post-block";
import { PostTransactionsHandler } from "./server/handlers/post-transactions";
import { Server } from "./server/server";
import { TransactionBroadcaster } from "./transaction-broadcaster";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		this.#registerFactories();

		this.#registerServices();

		this.#registerActions();

		await this.#registerServer();
	}

	public async bootWhen(): Promise<boolean> {
		return !process.env.DISABLE_P2P_SERVER;
	}

	public async boot(): Promise<void> {
		this.app.get<EventListener>(Identifiers.PeerEventListener).initialize();

		await this.app.get<Server>(Identifiers.P2PServer).boot();
	}

	public async dispose(): Promise<void> {
		await this.app.get<Server>(Identifiers.P2PServer).dispose();
	}

	public async required(): Promise<boolean> {
		return true;
	}

	public configSchema(): object {
		return Joi.object({
			blacklist: Joi.array().items(Joi.string()).required(),
			disableDiscovery: Joi.bool(),
			getBlocksTimeout: Joi.number().integer().min(0).required(),
			ignoreMinimumNetworkReach: Joi.bool(),
			maxPeerSequentialErrors: Joi.number().integer().min(0).required(),
			maxPeersBroadcast: Joi.number().integer().min(0).required(),
			maxSameSubnetPeers: Joi.number().integer().min(0).required(),
			minimumNetworkReach: Joi.number().integer().min(0).required(),
			minimumVersions: Joi.array().items(Joi.string()).required(),
			networkStart: Joi.bool(),
			rateLimit: Joi.number().integer().min(1).required(),
			rateLimitPostTransactions: Joi.number().integer().min(1).required(),
			remoteAccess: Joi.array()
				.items(Joi.string().ip({ version: ["ipv4", "ipv6"] }))
				.required(),
			server: Joi.object({
				hostname: Joi.string()
					.ip({ version: ["ipv4", "ipv6"] })
					.required(),
				logLevel: Joi.number().integer().min(0).required(),
				port: Joi.number().integer().min(1).max(65_535).required(), // TODO: Check
			}).required(),
			skipDiscovery: Joi.bool(),
			verifyTimeout: Joi.number().integer().min(0).required(),
			whitelist: Joi.array().items(Joi.string()).required(),
		}).unknown(true);
	}

	#registerFactories(): void {
		this.app
			.bind(Identifiers.PeerFactory)
			.toFactory<Peer>(() => (ip: string) => new Peer(ip, Number(this.config().get<number>("server.port"))!));
	}

	#registerServices(): void {
		this.app.bind(Identifiers.PeerRepository).to(PeerRepository).inSingletonScope();

		this.app.bind(Identifiers.PeerConnector).to(PeerConnector).inSingletonScope();

		this.app.bind(Identifiers.PeerCommunicator).to(PeerCommunicator).inSingletonScope();

		this.app.bind(Identifiers.PeerProcessor).to(PeerProcessor).inSingletonScope();

		this.app.bind(Identifiers.PeerChunkCache).to(ChunkCache).inSingletonScope();

		this.app.bind(Identifiers.PeerNetworkMonitor).to(NetworkMonitor).inSingletonScope();

		this.app.bind(Identifiers.PeerEventListener).to(EventListener).inSingletonScope();

		this.app.bind(Identifiers.PeerTransactionBroadcaster).to(TransactionBroadcaster);
	}

	#registerActions(): void {
		this.app
			.get<Services.Triggers.Triggers>(Identifiers.TriggerService)
			.bind("validateAndAcceptPeer", new ValidateAndAcceptPeerAction(this.app));
	}

	async #registerServer(): Promise<void> {
		this.app.bind(ResponseHandler.GetBlocks).to(GetBlocksHandler).inSingletonScope();
		this.app.bind(ResponseHandler.GetCommonBlocks).to(GetCommonBlocksHandler).inSingletonScope();
		this.app.bind(ResponseHandler.GetPeerStatus).to(GetPeerStatusHandler).inSingletonScope();
		this.app.bind(ResponseHandler.PostBlock).to(PostBlockHandler).inSingletonScope();
		this.app.bind(ResponseHandler.PostTransactions).to(PostTransactionsHandler).inSingletonScope();

		this.app.bind(Identifiers.P2PServer).to(Server).inSingletonScope();

		await this.app.get<Server>(Identifiers.P2PServer).register();
	}
}
