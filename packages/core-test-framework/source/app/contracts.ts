import { interfaces } from "@arkecosystem/core-container";
import { Contracts } from "@arkecosystem/core-contracts";
import { Application, Types } from "@arkecosystem/core-kernel";
import { Paths } from "env-paths";

export interface Wallet {
	address: string;
	passphrase: string;
	keys: Contracts.Crypto.IKeyPair;
	username: string | undefined;
}

export interface CoreOptions {
	flags?: {
		token: string;
		network: string;
		env?: string;
		paths?: Paths;
	};
	plugins?: {
		options?: Record<string, Record<string, any>>;
	};
	peers?: Types.JsonObject;
	validators?: Types.JsonObject;
	environment?: Types.JsonObject;
	app?: Types.JsonObject;
}

export interface SandboxOptions {
	core: CoreOptions;
	crypto: Contracts.NetworkGenerator.Options;
}

export interface CoreConfigPaths {
	root: string;
	env: string;
	app: string;
	validators: string;
	peers: string;
}

export interface CryptoConfigPaths {
	root: string;
	crypto: string;
}

export type SandboxCallback = (context: { app: Application; container: interfaces.Container }) => void;
