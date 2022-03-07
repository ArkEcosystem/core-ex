import { BigNumber } from "@arkecosystem/utils";

import { IBlock, IBlockData, ITransaction } from "./crypto";
import { DownloadBlock } from "./shared";
import { Wallet } from "./state";

export interface IRound {
	publicKey: string;
	round: BigNumber;
	balance: BigNumber;
}

export interface IDatabaseService {
	getBlock(id: string): Promise<IBlock | undefined>;

	findBlocksByHeightRange(start: number, end: number): Promise<IBlock[]>;

	getBlocks(start: number, end: number, headersOnly?: boolean): Promise<IBlockData[]>;

	getBlocksForDownload(offset: number, limit: number, headersOnly?: boolean): Promise<DownloadBlock[]>;

	findBlockByHeights(heights: number[]): Promise<IBlock[]>;

	findLatestBlock(): Promise<IBlock | undefined>;

	getTransaction(id: string): Promise<ITransaction | undefined>;

	saveBlocks(blocks: IBlock[]): Promise<void>;

	findBlocksByIds(ids: any[]): Promise<IBlock[]>;

	getRound(round: number): Promise<IRound[]>;

	saveRound(activeValidators: readonly Wallet[]): Promise<void>;

	deleteRound(round: number): Promise<void>;

	// @TODO
	getLastBlock(): Promise<IBlock | undefined>;

	deleteBlocks(blocks: IBlockData[]): Promise<void>;

	findBlockByIds(id: string[]): Promise<IBlockData[]>;

	getValidatorsForgedBlocks(): Promise<IBlockData[]>;

	getLastForgedBlocks(): Promise<IBlockData[]>;

	verifyBlockchain(): Promise<boolean>;

	getForgedTransactionsIds(ids: string[]): Promise<string[]>;

	deleteTopBlocks(count: number): Promise<void>;
}
