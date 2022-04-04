export type EnvironmentOptions = {
	coreDBHost: string;
	coreDBPort: number;
	coreDBUsername?: string;
	coreDBPassword?: string;
	coreDBDatabase?: string;

	coreP2PPort: number;
	coreWebhooksPort: number;
};

export type InternalOptions = EnvironmentOptions & {
	network: string;
	premine: string;
	validators: number;
	blockTime: number;
	maxTxPerBlock: number;
	maxBlockPayload: number;
	rewardHeight: number;
	rewardAmount: string | number;
	pubKeyHash: number;
	wif: number;
	token: string;
	symbol: string;
	explorer: string;
	distribute: boolean;
	epoch: Date;
	vendorFieldLength: number;

	// Peers
	peers: string[];

	// General
	configPath?: string;
	overwriteConfig: boolean;
	force: boolean;
};

export type Options = Partial<InternalOptions> & {
	network: string;
	token: string;
	symbol: string;
};
