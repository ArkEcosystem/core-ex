import { CoreConfigPaths, CryptoConfigPaths, SandboxOptions } from "../contracts";
import { CoreGenerator } from "./core";
import { CryptoGenerator } from "./crypto";
import { NetworkGenerator } from "@arkecosystem/core-network-generate";

export const generateCoreConfig = (options?: SandboxOptions): CoreConfigPaths => new CoreGenerator(options).generate();

export const generateCryptoConfig = async (options?: SandboxOptions): Promise<void> => {
	const generator = new NetworkGenerator();

	await generator.generate(options.crypto);
};

// export const generateCryptoConfigRaw = (options?: SandboxOptions) => {
// 	const { crypto } = generateCryptoConfig(options);

// 	return {
// 		genesisBlock: require(crypto).genesisBlock,
// 		milestones: require(crypto).milestones,
// 		network: require(crypto).network,
// 	};
// };
