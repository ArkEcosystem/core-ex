import { Container } from "@arkecosystem/container";
import { ISerializeOptions, TransactionType, TransactionTypeGroup } from "@arkecosystem/crypto-contracts";
import { Address } from "@arkecosystem/crypto-identities";
import { schemas, Transaction } from "@arkecosystem/crypto-transaction";
import { BigNumber, ByteBuffer } from "@arkecosystem/utils";

@Container.injectable()
export abstract class One extends Transaction {
	public static typeGroup: number = TransactionTypeGroup.Core;
	public static type: number = TransactionType.Transfer;
	public static key = "transfer";
	public static version = 1;

	protected static defaultStaticFee: BigNumber = BigNumber.make("10000000");

	public static getSchema(): schemas.TransactionSchema {
		return schemas.extend(schemas.transactionBaseSchema, {
			$id: "transfer",
			properties: {
				expiration: { minimum: 0, type: "integer" },
				fee: { bignumber: { bypassGenesis: true, minimum: 1 } },
				recipientId: { $ref: "address" },
				type: { transactionType: TransactionType.Transfer },
				vendorField: { anyOf: [{ type: "null" }, { format: "vendorField", type: "string" }] },
			},
			required: ["recipientId"],
		});
	}

	public hasVendorField(): boolean {
		return true;
	}

	public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
		const { data } = this;
		const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(33));
		buff.writeBigUInt64LE(data.amount.toBigInt());
		buff.writeUInt32LE(data.expiration || 0);

		if (data.recipientId) {
			const { addressBuffer, addressError } = Address.toBuffer(
				data.recipientId,
				this.configuration.get("network"),
			);

			if (options) {
				options.addressError = addressError;
			}

			buff.writeBuffer(addressBuffer);
		}

		return buff;
	}

	public deserialize(buf: ByteBuffer): void {
		const { data } = this;
		data.amount = BigNumber.make(buf.readBigUInt64LE().toString());
		data.expiration = buf.readUInt32LE();
		data.recipientId = Address.fromBuffer(buf.readBuffer(21));
	}
}
