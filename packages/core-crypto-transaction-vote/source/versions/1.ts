import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { schemas, Transaction } from "@arkecosystem/core-crypto-transaction";
import { ByteBuffer } from "@arkecosystem/utils";

@injectable()
export class VoteTransaction extends Transaction {
	@inject(Identifiers.Application)
	public readonly app!: Contracts.Kernel.Application;

	public static typeGroup: number = Contracts.Crypto.TransactionTypeGroup.Core;
	public static type: number = Contracts.Crypto.TransactionType.Vote;
	public static key = "vote";

	public static getSchema(): schemas.TransactionSchema {
		return schemas.extend(schemas.transactionBaseSchema, {
			$id: "vote",
			properties: {
				amount: { bignumber: { maximum: 0, minimum: 0 } },
				asset: {
					properties: {
						votes: {
							additionalItems: false,
							items: { $ref: "walletVote" },
							maxItems: 2,
							minItems: 1,
							type: "array",
						},
					},
					required: ["votes"],
					type: "object",
				},
				fee: { bignumber: { minimum: 1 } },
				recipientId: { $ref: "address" },
				type: { transactionType: Contracts.Crypto.TransactionType.Vote },
			},
			required: ["asset"],
		});
	}

	public async serialize(options?: Contracts.Crypto.ISerializeOptions): Promise<ByteBuffer | undefined> {
		const { data } = this;
		const publicKeySize = this.app.get<number>(Identifiers.Cryptography.Size.PublicKey);
		const buff: ByteBuffer = ByteBuffer.fromSize(
			4 + 4 + publicKeySize * data.asset.votes.length + publicKeySize * data.asset.unvotes.length,
		);

		// TODO: Check asset

		buff.writeUint8(data.asset.votes.length);
		buff.writeBytes(Buffer.from(data.asset.votes.join(""), "hex"));

		buff.writeUint8(data.asset.unvotes.length);
		buff.writeBytes(Buffer.from(data.asset.unvotes.join(""), "hex"));

		return buff;
	}

	public async deserialize(buf: ByteBuffer): Promise<void> {
		const { data } = this;
		data.asset = { unvotes: [], votes: [] };
		const publicKeySize = this.app.get<number>(Identifiers.Cryptography.Size.PublicKey);

		const votelength: number = buf.readUint8();
		for (let index = 0; index < votelength; index++) {
			const vote: string = buf.readBytes(publicKeySize).toString("hex");

			data.asset.votes.push(vote);
		}

		const unvotelength: number = buf.readUint8();
		for (let index = 0; index < unvotelength; index++) {
			const unvote: string = buf.readBytes(publicKeySize).toString("hex");

			data.asset.unvotes.push(unvote);
		}
	}
}
