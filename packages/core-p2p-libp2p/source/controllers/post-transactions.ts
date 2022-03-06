import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";

import { IMessage } from "../contracts";
import { decodeMessage } from "../utils";

@injectable()
export class PostTransactionsHandler {
	@inject(Identifiers.TransactionPoolProcessor)
	private readonly processor!: Contracts.TransactionPool.Processor;

	public async handle(message: IMessage): Promise<string[]> {
		return (
			await this.processor.process(
				decodeMessage<Uint8Array[]>(message).map((transaction: Uint8Array) => Buffer.from(transaction)),
			)
		).accept;
	}
}
