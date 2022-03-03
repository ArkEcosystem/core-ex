import { injectable } from "@arkecosystem/core-container";
import { Crypto } from "@arkecosystem/core-contracts";
import { schemas, Transaction } from "@arkecosystem/core-crypto-transaction";
import { BigNumber, ByteBuffer } from "@arkecosystem/utils";

@injectable()
export class VoteTransaction extends Transaction {
	public static typeGroup: number = Crypto.TransactionTypeGroup.Core;
	public static type: number = Crypto.TransactionType.Vote;
	public static key = "vote";
	public static version = 1;

	protected static defaultStaticFee: BigNumber = BigNumber.make("100000000");

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
				type: { transactionType: Crypto.TransactionType.Vote },
			},
			required: ["asset"],
		});
	}

	public async serialize(options?: Crypto.ISerializeOptions): Promise<ByteBuffer | undefined> {
		const { data } = this;
		const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(100));

		if (data.asset && data.asset.votes) {
			const voteBytes = data.asset.votes
				.map((vote) => (vote.startsWith("+") ? "01" : "00") + vote.slice(1))
				.join("");
			buff.writeUInt8(data.asset.votes.length);
			buff.writeBuffer(Buffer.from(voteBytes, "hex"));
		}

		return buff;
	}

	public async deserialize(buf: ByteBuffer): Promise<void> {
		const { data } = this;
		const votelength: number = buf.readUInt8();
		data.asset = { votes: [] };

		for (let index = 0; index < votelength; index++) {
			// @TODO: deserialising votes requires length+1 unless we drop the prefix and use separate arrays
			let vote: string = buf.readBuffer(33).toString("hex"); // 33=schnorr,34=ecdsa
			vote = (vote[1] === "1" ? "+" : "-") + vote.slice(2);

			if (data.asset && data.asset.votes) {
				data.asset.votes.push(vote);
			}
		}
	}
}
