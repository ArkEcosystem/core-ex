import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { FastifyRequest } from "fastify";

@injectable()
export class PostTransactionsHandler {
	@inject(Identifiers.TransactionPoolProcessor)
	private readonly processor!: Contracts.TransactionPool.Processor;

	public async handle(request: FastifyRequest): Promise<string[]> {
		const result = await this.processor.process((request.body as any).transactions as Buffer[]);
		return result.accept;
	}
}
