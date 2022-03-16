import { Transactions } from "@arkecosystem/crypto";
import { Contracts } from "@arkecosystem/core-contracts";
import { VoteBuilder } from "../../../core-crypto-transaction-vote/";

export const makeVoteTransactions = (length: number, voteAssets: string[]): Contracts.Crypto.ITransaction[] => {
	const txs: Contracts.Crypto.ITransaction[] = [];
	for (let index = 0; index < length; index++) {
		txs[index] = Transactions.BuilderFactory.vote().sign(Math.random().toString(36)).votesAsset(voteAssets).build();
	}
	return txs;
};
