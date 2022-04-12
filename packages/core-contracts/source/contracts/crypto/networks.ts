import { IBlockJson } from "./block";

export interface NetworkConfig {
	genesisBlock: IBlockJson;
	milestones: Partial<Milestone>[];
	network: Network;
}

export interface Network {
	name: string;
	messagePrefix: string;
	pubKeyHash: number;
	nethash: string;
	wif: number;
	slip44: number;
	client: {
		token: string;
		symbol: string;
		explorer: string;
	};
}

export interface MilestoneBlock {
	maxPayload: number;
	maxTransactions: number;
	version: number;
}
export interface MilestoneSatoshi {
	decimals: number;
	denomination: number;
}

export interface Milestone {
	height: number;
	activeValidators: number;
	address: Record<string, any>;
	block: MilestoneBlock;
	blockTime: number;
	epoch: string;
	multiPaymentLimit: number;
	reward: string;
	satoshi: MilestoneSatoshi;
	vendorFieldLength: number;
}

export interface MilestoneSearchResult {
	found: boolean;
	height: number;
	data: any;
}
