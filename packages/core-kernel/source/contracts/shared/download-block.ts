import Interfaces from "@arkecosystem/core-crypto-contracts";

export interface DownloadBlock extends Omit<Interfaces.IBlockData, "transactions"> {
	transactions: string[];
}
