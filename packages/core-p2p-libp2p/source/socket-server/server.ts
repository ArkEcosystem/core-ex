import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Types } from "@arkecosystem/core-kernel";
import { NOISE } from "@chainsafe/libp2p-noise";
import Libp2p from "libp2p";
import Bootstrap from "libp2p-bootstrap";
// import MPLEX from 'libp2p-mplex';
import TCP from "libp2p-tcp";
// import { Mplex } from '@libp2p/mplex'

// import { plugin as hapiNesPlugin } from "../hapi-nes";
// import { AcceptPeerPlugin } from "./plugins/accept-peer";
// import { AwaitBlockPlugin } from "./plugins/await-block";
// import { CodecPlugin } from "./plugins/codec";
// import { IsAppReadyPlugin } from "./plugins/is-app-ready";
// import { RateLimitPlugin } from "./plugins/rate-limit";
// import { ValidatePlugin } from "./plugins/validate";
// import { WhitelistForgerPlugin } from "./plugins/whitelist-forger";
// import { BlocksRoute } from "./routes/blocks";
// import { InternalRoute } from "./routes/internal";
// import { PeerRoute } from "./routes/peer";
// import { TransactionsRoute } from "./routes/transactions";

@injectable()
export class Server {
	@inject(Identifiers.Application)
	private readonly app!: Contracts.Kernel.Application;

	@inject(Identifiers.LogService)
	private readonly logger!: Contracts.Kernel.Logger;

	private server!: Libp2p;

	private name!: string;

	public async initialize(name: string, optionsServer: Types.JsonObject): Promise<void> {
		this.name = name;

		this.server = await Libp2p.create({
			addresses: {
				listen: [`/ip4/${optionsServer.hostname}/tcp/0`],
			},
			config: {
				peerDiscovery: {
					autoDial: true,
					[Bootstrap.tag]: {
						enabled: true,
						list: [],
					},
				},
			},
			// @ts-ignore
			modules: {
				connEncryption: [NOISE],
				// peerDiscovery: [Bootstrap],
				// @TODO: this errors because the interface and implementation don't match
				// streamMuxer: [MPLEX],
				transport: [TCP],
			},
		});

		this.server.on("peer:discovery", (peer) => {
			this.logger.info(`Discovered ${peer.id.toB58String()}`);
		});

		this.server.connectionManager.on("peer:connect", (connection) => {
			this.logger.info(`Connected to ${connection.remotePeer.toB58String()}`);
		});

		// this.server = new HapiServer({ address, port });
		// this.server.app = this.app;
		// await this.server.register({
		// 	options: {
		// 		maxPayload: 20_971_520, // 20 MB TODO to adjust
		// 	},
		// 	plugin: hapiNesPlugin,
		// });

		// this.app.resolve(InternalRoute).register(this.server);
		// this.app.resolve(PeerRoute).register(this.server);
		// this.app.resolve(BlocksRoute).register(this.server);
		// this.app.resolve(TransactionsRoute).register(this.server);

		// // onPreAuth
		// this.app.resolve(WhitelistForgerPlugin).register(this.server);
		// this.app.resolve(RateLimitPlugin).register(this.server);
		// this.app.resolve(AwaitBlockPlugin).register(this.server);

		// // onPostAuth
		// this.app.resolve(CodecPlugin).register(this.server);
		// this.app.resolve(ValidatePlugin).register(this.server);
		// this.app.resolve(IsAppReadyPlugin).register(this.server);

		// // onPreHandler
		// this.app.resolve(AcceptPeerPlugin).register(this.server);
	}

	public async boot(): Promise<void> {
		try {
			await this.server.start();

			for (const addr of this.server.multiaddrs) {
				this.logger.info(
					`libp2p started listening on address: ${addr.toString()}/p2p/${this.server.peerId.toB58String()}`,
				);
			}
		} catch (error) {
			console.log(error);
			await this.app.terminate(`Failed to start ${this.name}!`);
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
			await this.app.terminate(`Failed to stop ${this.name}!`);
		}
	}

	// @todo: add proper types
	public async register(plugins: any | any[]): Promise<void> {
		// await this.server.register(plugins);
	}

	public async route(routes: any): Promise<void> {
		// await this.server.route(routes);
	}

	public async inject(options: any): Promise<any> {
		// await this.server.inject(options);
	}
}
