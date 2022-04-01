export type FactoryFunctionOptions = Record<string, any>;

export type FactoryFunction = ({ entity, options }: { entity?: any; options: FactoryFunctionOptions }) => Promise<any>;

export type HookFunction = ({ entity, options }: { entity?: any; options: FactoryFunctionOptions }) => void;

export type TransactionOptions = {
	version?: number;
	nonce?: string;
	timestamp?: number;
	senderPublicKey?: string;
	passphrase?: string;
	passphrases?: string[];
};

export type TransferOptions = TransactionOptions & {
	amount?: string;
	fee?: string;
	recipientId?: string;
	vendorField?: string;
};

export type ValidatorRegistrationOptions = TransactionOptions & {
	fee?: string;
	username?: string;
};

export type ValidatorResignationOptions = TransactionOptions & {
	fee?: string;
};

export type VoteOptions = TransactionOptions & {
	fee?: string;
	publicKey?: string;
};

export type MultiSignatureOptions = TransactionOptions & {
	fee?: string;
	publicKeys?: string[];
	min?: number;
};

export type MultiPaymentOptions = TransactionOptions & {
	fee?: string;
	payments?: {
		amount: string;
		recipientId: string;
	}[];
};
