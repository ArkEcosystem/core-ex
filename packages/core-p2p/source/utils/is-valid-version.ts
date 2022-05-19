import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Providers } from "@arkecosystem/core-kernel";
import semver from "semver";

// @TODO review the implementation
export const isValidVersion = (app: Contracts.Kernel.Application, peer: Contracts.P2P.Peer): boolean => {
	if (!peer.version) {
		return false;
	}

	if (!semver.valid(peer.version)) {
		return false;
	}

	const pluginConfiguration = app.getTagged<Providers.PluginConfiguration>(
		Identifiers.PluginConfiguration,
		"plugin",
		"core-p2p",
	);
	const minimumVersions = pluginConfiguration.getOptional<string[]>("minimumVersions", []);

	const includePrerelease: boolean =
		app.get<Contracts.Crypto.IConfiguration>(Identifiers.Cryptography.Configuration).get("network.name") !==
		"mainnet";
		
	return minimumVersions.some((minimumVersion: string) =>
		semver.satisfies(peer.version, minimumVersion, { includePrerelease }),
	);
};
