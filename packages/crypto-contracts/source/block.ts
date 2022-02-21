import { ITransaction, ITransactionData, ITransactionJson } from "./transactions";

export interface IBlockVerification {
	verified: boolean;
	errors: string[];
	containsMultiSignatures: boolean;
}

export interface IBlock {
	serialized: string;
	data: IBlockData;
	transactions: ITransaction[];
	verification: IBlockVerification;

	getHeader(): IBlockData;
	verifySignature(): Promise<boolean>;
	verify(): Promise<IBlockVerification>;

	toString(): string;
	toJson(): IBlockJson;
}

export interface IBlockData {
	id?: string;
	idHex?: string;

	timestamp: number;
	version: number;
	height: number;
	previousBlockHex?: string;
	previousBlock: string;
	numberOfTransactions: number;
	totalAmount: any; // @TODO: use BigNumber from ../../crypto/utils
	totalFee: any; // @TODO: use BigNumber from ../../crypto/utils
	reward: any; // @TODO: use BigNumber from ../../crypto/utils
	payloadLength: number;
	payloadHash: string;
	generatorPublicKey: string;

	blockSignature?: string;
	serialized?: string;
	transactions?: ITransactionData[];
}

export interface IBlockJson {
	id?: string;
	idHex?: string;

	timestamp: number;
	version: number;
	height: number;
	previousBlockHex?: string;
	previousBlock: string;
	numberOfTransactions: number;
	totalAmount: string;
	totalFee: string;
	reward: string;
	payloadLength: number;
	payloadHash: string;
	generatorPublicKey: string;

	blockSignature?: string;
	serialized?: string;
	transactions?: ITransactionJson[];
}

export type BlockFactoryInstance = (data: { data: IBlockData; transactions: ITransaction[]; id?: string }) => IBlock;
