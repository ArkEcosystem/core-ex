import { inject, injectable, postConstruct, tagged } from "@arkecosystem/core-container";
import { Constants, Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Enums, Providers, Utils as KernelUtils } from "@arkecosystem/core-kernel";

import { PeerFactory } from "./contracts";
import { DisconnectInvalidPeers } from "./listeners";
import { isValidPeer } from "./validation";

// @TODO review the implementation
@injectable()
export class PeerProcessor implements Contracts.P2P.PeerProcessor {
	@inject(Identifiers.Application)
	private readonly app!: Contracts.Kernel.Application;

	@inject(Identifiers.PluginConfiguration)
	@tagged("plugin", "core-p2p")
	private readonly configuration!: Providers.PluginConfiguration;

	@inject(Identifiers.PeerCommunicator)
	private readonly communicator!: Contracts.P2P.PeerCommunicator;

	@inject(Identifiers.PeerConnector)
	private readonly connector!: Contracts.P2P.PeerConnector;

	@inject(Identifiers.PeerRepository)
	private readonly repository!: Contracts.P2P.PeerRepository;

	@inject(Identifiers.EventDispatcherService)
	private readonly events!: Contracts.Kernel.EventDispatcher;

	@inject(Identifiers.LogService)
	private readonly logger!: Contracts.Kernel.Logger;

	public server: any;
	public nextUpdateNetworkStatusScheduled = false;

	@postConstruct()
	public initialize(): void {
		this.events.listen(Enums.CryptoEvent.MilestoneChanged, this.app.resolve(DisconnectInvalidPeers));
	}

	public isWhitelisted(peer: Contracts.P2P.Peer): boolean {
		return KernelUtils.isWhitelisted(this.configuration.getOptional<string[]>("remoteAccess", []), peer.ip);
	}

	public async validateAndAcceptPeer(
		peer: Contracts.P2P.Peer,
		options: Contracts.P2P.AcceptNewPeerOptions = {},
	): Promise<void> {
		if (this.validatePeerIp(peer, options)) {
			await this.#acceptNewPeer(peer, options);
		}
	}

	public validatePeerIp(peer, options: Contracts.P2P.AcceptNewPeerOptions = {}): boolean {
		if (this.configuration.get("disableDiscovery")) {
			this.logger.warning(`Rejected ${peer.ip} because the relay is in non-discovery mode.`);

			return false;
		}

		if (!isValidPeer(peer) || this.repository.hasPendingPeer(peer.ip)) {
			return false;
		}

		// Is Whitelisted
		if (!KernelUtils.isWhitelisted(this.configuration.get("whitelist") || [], peer.ip)) {
			return false;
		}

		// Is Blacklisted
		if (KernelUtils.isBlacklisted(this.configuration.get("blacklist") || [], peer.ip)) {
			return false;
		}

		const maxSameSubnetPeers = this.configuration.getRequired<number>("maxSameSubnetPeers");

		if (this.repository.getSameSubnetPeers(peer.ip).length >= maxSameSubnetPeers && !options.seed) {
			if (process.env[Constants.Flags.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA]) {
				this.logger.warning(
					`Rejected ${peer.ip} because we are already at the ${maxSameSubnetPeers} limit for peers sharing the same /24 subnet.`,
				);
			}

			return false;
		}

		return true;
	}

	async #acceptNewPeer(peer, options: Contracts.P2P.AcceptNewPeerOptions): Promise<void> {
		if (this.repository.hasPeer(peer.ip)) {
			return;
		}

		const newPeer: Contracts.P2P.Peer = this.app.get<PeerFactory>(Identifiers.PeerFactory)(peer.ip);

		try {
			this.repository.setPendingPeer(peer);

			const verifyTimeout = this.configuration.getRequired<number>("verifyTimeout");

			await this.communicator.ping(newPeer, verifyTimeout);

			this.repository.setPeer(newPeer);

			if (!options.lessVerbose || process.env[Constants.Flags.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA]) {
				this.logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port} (v${newPeer.version})`);
			}

			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			this.events.dispatch(Enums.PeerEvent.Added, newPeer);
		} catch {
			this.connector.disconnect(newPeer);
		} finally {
			this.repository.forgetPendingPeer(peer);
		}
	}
}
