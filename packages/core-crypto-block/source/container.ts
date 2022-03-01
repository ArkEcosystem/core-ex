import { IBlock, IBlockData, ITransaction } from "@arkecosystem/core-crypto-contracts";

export const INTERNAL_FACTORY = Symbol.for("Internal<BlockFactory>");

export type InternalFactory = (data: {
	data: IBlockData;
	transactions: ITransaction[];
	id?: string;
}) => Promise<IBlock>;
