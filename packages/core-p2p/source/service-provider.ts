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
import { TransactionBroadcaster } from "./transaction-broadcaster";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		this.registerFactories();

		this.registerServices();

		this.registerActions();
	}

	public async bootWhen(): Promise<boolean> {
		return !process.env.DISABLE_P2P_SERVER;
	}

	public async boot(): Promise<void> {
		this.app.get<EventListener>(Identifiers.PeerEventListener).initialize();
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

	private registerFactories(): void {
		this.app
			.bind(Identifiers.PeerFactory)
			.toFactory<Peer>(() => (ip: string) => new Peer(ip, Number(this.config().get<number>("server.port"))!));
	}

	private registerServices(): void {
		this.app.bind(Identifiers.PeerRepository).to(PeerRepository).inSingletonScope();

		this.app.bind(Identifiers.PeerConnector).to(PeerConnector).inSingletonScope();

		this.app.bind(Identifiers.PeerCommunicator).to(PeerCommunicator).inSingletonScope();

		this.app.bind(Identifiers.PeerProcessor).to(PeerProcessor).inSingletonScope();

		this.app.bind(Identifiers.PeerChunkCache).to(ChunkCache).inSingletonScope();

		this.app.bind(Identifiers.PeerNetworkMonitor).to(NetworkMonitor).inSingletonScope();

		this.app.bind(Identifiers.PeerEventListener).to(EventListener).inSingletonScope();

		this.app.bind(Identifiers.PeerTransactionBroadcaster).to(TransactionBroadcaster);
	}

	private registerActions(): void {
		this.app
			.get<Services.Triggers.Triggers>(Identifiers.TriggerService)
			.bind("validateAndAcceptPeer", new ValidateAndAcceptPeerAction(this.app));
	}
}
