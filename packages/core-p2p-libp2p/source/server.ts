import { TextEncoder } from "util";
import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
// import { Providers, Types } from "@arkecosystem/core-kernel";
import { NOISE } from "@chainsafe/libp2p-noise";
import libp2p from "libp2p";
import Bootstrap from "libp2p-bootstrap";
import Gossipsub from "libp2p-gossipsub";
// import MPLEX from 'libp2p-mplex';
import TCP from "libp2p-tcp";

import { IMessage, PubSubHandler } from "./contracts";
import { GetCommonBlocksHandler } from "./controllers/common-blocks";
import { GetBlocksHandler } from "./controllers/get-blocks";
import { GetPeerStatusHandler } from "./controllers/peer-status";
import { PostBlockHandler } from "./controllers/post-block";
import { PostTransactionsHandler } from "./controllers/post-transactions";

@injectable()
export class Server {
	@inject(Identifiers.Application)
	private readonly app!: Contracts.Kernel.Application;

	// @inject(Identifiers.PluginConfiguration)
	// @tagged("plugin", "core-p2p-libp2p")
	// private readonly configuration!: Providers.PluginConfiguration;

	@inject(Identifiers.LogService)
	private readonly logger!: Contracts.Kernel.Logger;

	@inject(PubSubHandler.GetBlocks)
	private readonly getBlocksHandler!: GetBlocksHandler;

	@inject(PubSubHandler.GetCommonBlocks)
	private readonly getCommonBlocksHandler!: GetCommonBlocksHandler;

	@inject(PubSubHandler.GetPeerStatus)
	private readonly getPeerStatusHandler!: GetPeerStatusHandler;

	@inject(PubSubHandler.PostBlock)
	private readonly postBlockHandler!: PostBlockHandler;

	@inject(PubSubHandler.PostTransactions)
	private readonly postTransactionsHandler!: PostTransactionsHandler;

	private server: libp2p;

	public async register(): Promise<void> {
		this.server = await libp2p.create({
			addresses: {
				listen: ["/ip4/0.0.0.0/tcp/0"],
			},
			config: {
				peerDiscovery: {
					autoDial: true,
					[Bootstrap.tag]: {
						enabled: true,
						list: [],
					},
				},
				pubsub: {
					emitSelf: true, // @TODO: only true for debug/test/dev, add a flag
					enabled: true,
				},
			},
			// @ts-ignore
			modules: {
				connEncryption: [NOISE],
				// peerDiscovery: [Bootstrap],
				pubsub: Gossipsub,
				// @TODO: this errors because the interface and implementation don't match
				// streamMuxer: [MPLEX],
				transport: [TCP],
			},
		});

		await this.#registerPubSub();
	}

	public async boot(): Promise<void> {
		try {
			await this.server.start();

			for (const addr of this.server.multiaddrs) {
				this.logger.info(
					`libp2p started listening on address: ${addr.toString()}/p2p/${this.server.peerId.toB58String()}`,
				);
			}

			// @TODO: use protobuf schemas for messages
			await this.server.pubsub.publish(
				PubSubHandler.GetBlocks,
				new TextEncoder().encode(
					JSON.stringify({
						blockLimit: 500,
						headersOnly: false,
						lastBlockHeight: 1,
					}),
				),
			);
		} catch (error) {
			console.log(error);
			await this.app.terminate(`Failed to start libp2p!`);
		}
	}

	public async dispose(): Promise<void> {
		try {
			for (const addr of this.server.multiaddrs) {
				this.logger.info(
					`libp2p stopped listening on address: ${addr.toString()}/p2p/${this.server.peerId.toB58String()}`,
				);
			}

			await this.server.stop();
		} catch {
			await this.app.terminate(`Failed to stop libp2p!`);
		}
	}

	async #registerPubSub(): Promise<void> {
		await this.server.pubsub.start();

		this.server.on("peer:discovery", (peer) => {
			this.logger.info(`Discovered ${peer.id.toB58String()}`);
		});

		this.server.connectionManager.on("peer:connect", (connection) => {
			this.logger.info(`Connected to ${connection.remotePeer.toB58String()}`);
		});

		// @TODO: doesn't really fit into pubsub
		this.server.pubsub.on(PubSubHandler.GetBlocks, (message: IMessage) => this.getBlocksHandler.handle(message));

		// @TODO: doesn't really fit into pubsub
		this.server.pubsub.on(PubSubHandler.GetCommonBlocks, (message: IMessage) =>
			this.getCommonBlocksHandler.handle(message),
		);

		// @TODO: doesn't really fit into pubsub
		this.server.pubsub.on(PubSubHandler.GetPeerStatus, (message: IMessage) =>
			this.getPeerStatusHandler.handle(message),
		);

		this.server.pubsub.on(PubSubHandler.PostBlock, (message: IMessage) => this.postBlockHandler.handle(message));

		this.server.pubsub.on(PubSubHandler.PostTransactions, (message: IMessage) =>
			this.postTransactionsHandler.handle(message),
		);

		this.server.pubsub.subscribe(PubSubHandler.GetBlocks);
		this.server.pubsub.subscribe(PubSubHandler.GetCommonBlocks);
		this.server.pubsub.subscribe(PubSubHandler.GetPeerStatus);
		this.server.pubsub.subscribe(PubSubHandler.PostBlock);
		this.server.pubsub.subscribe(PubSubHandler.PostTransactions);
	}
}
