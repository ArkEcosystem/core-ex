import assert from "assert";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { inject, injectable } from "@arkecosystem/core-container";

import { BlockRepository } from "./repositories/block-repository";
import { TransactionRepository } from "./repositories/transaction-repository";

@injectable()
export class BlockHistoryService implements Contracts.Shared.BlockHistoryService {
	@inject(Identifiers.DatabaseBlockRepository)
	private readonly blockRepository!: BlockRepository;

	@inject(Identifiers.DatabaseTransactionRepository)
	private readonly transactionRepository!: TransactionRepository;

	@inject(Identifiers.DatabaseBlockFilter)
	private readonly blockFilter!: Contracts.Database.BlockFilter;

	@inject(Identifiers.DatabaseTransactionFilter)
	private readonly transactionFilter!: Contracts.Database.TransactionFilter;

	@inject(Identifiers.DatabaseModelConverter)
	private readonly modelConverter!: Contracts.Database.ModelConverter;

	public async findOneByCriteria(
		criteria: Contracts.Shared.OrBlockCriteria,
	): Promise<Contracts.Crypto.IBlockData | undefined> {
		const data = await this.findManyByCriteria(criteria);
		assert(data.length <= 1);
		return data[0];
	}

	public async findManyByCriteria(
		criteria: Contracts.Shared.OrBlockCriteria,
	): Promise<Contracts.Crypto.IBlockData[]> {
		const expression = await this.blockFilter.getExpression(criteria);
		const sorting: Contracts.Search.Sorting = [{ direction: "asc", property: "height" }];
		const models = await this.blockRepository.findManyByExpression(expression, sorting);
		return this.modelConverter.getBlockData(models);
	}

	public async listByCriteria(
		criteria: Contracts.Shared.OrBlockCriteria,
		sorting: Contracts.Search.Sorting,
		pagination: Contracts.Search.Pagination,
		options?: Contracts.Search.Options,
	): Promise<Contracts.Search.ResultsPage<Contracts.Crypto.IBlockData>> {
		const expression = await this.blockFilter.getExpression(criteria);
		const modelResultsPage = await this.blockRepository.listByExpression(expression, sorting, pagination, options);
		const models = modelResultsPage.results;
		const data = await this.modelConverter.getBlockData(models);
		return { ...modelResultsPage, results: data };
	}

	public async findOneByCriteriaJoinTransactions(
		blockCriteria: Contracts.Shared.OrBlockCriteria,
		transactionCriteria: Contracts.Shared.OrTransactionCriteria,
	): Promise<Contracts.Shared.BlockDataWithTransactionData | undefined> {
		const data = await this.findManyByCriteriaJoinTransactions(blockCriteria, transactionCriteria);
		return data[0];
	}

	public async findManyByCriteriaJoinTransactions(
		blockCriteria: Contracts.Shared.OrBlockCriteria,
		transactionCriteria: Contracts.Shared.OrTransactionCriteria,
	): Promise<Contracts.Shared.BlockDataWithTransactionData[]> {
		const blockExpression = await this.blockFilter.getExpression(blockCriteria);
		const blockModels = await this.blockRepository.findManyByExpression(blockExpression);

		const transactionBlockCriteria = blockModels.map((b) => ({ blockId: b.id }));
		const transactionExpression = await this.transactionFilter.getExpression(
			transactionCriteria,
			transactionBlockCriteria,
		);
		const transactionModels = await this.transactionRepository.findManyByExpression(transactionExpression);
		return this.modelConverter.getBlockDataWithTransactionData(blockModels, transactionModels);
	}

	public async listByCriteriaJoinTransactions(
		blockCriteria: Contracts.Search.OrCriteria<Contracts.Shared.BlockCriteria>,
		transactionCriteria: Contracts.Search.OrCriteria<Contracts.Shared.TransactionCriteria>,
		sorting: Contracts.Search.Sorting,
		pagination: Contracts.Search.Pagination,
		options?: Contracts.Search.Options,
	): Promise<Contracts.Search.ResultsPage<Contracts.Shared.BlockDataWithTransactionData>> {
		const blockExpression = await this.blockFilter.getExpression(blockCriteria);
		const blockModelResultsPage = await this.blockRepository.listByExpression(
			blockExpression,
			sorting,
			pagination,
			options,
		);
		const blockModels = blockModelResultsPage.results;

		const transactionBlockCriteria = blockModels.map((b) => ({ blockId: b.id }));
		const transactionExpression = await this.transactionFilter.getExpression(
			transactionCriteria,
			transactionBlockCriteria,
		);
		const transactionModels = await this.transactionRepository.findManyByExpression(transactionExpression);
		const blockDataWithTransactionData = await this.modelConverter.getBlockDataWithTransactionData(
			blockModels,
			transactionModels,
		);

		return { ...blockModelResultsPage, results: blockDataWithTransactionData };
	}
}
