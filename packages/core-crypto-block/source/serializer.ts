import { Container } from "@arkecosystem/core-container";
import { BINDINGS, IBlock, IBlockData, IBlockSerializer, ITransactionData } from "@arkecosystem/core-crypto-contracts";
import { PreviousBlockIdFormatError } from "@arkecosystem/core-crypto-errors";
import { Utils } from "@arkecosystem/core-crypto-transaction";
import assert from "assert";
import ByteBuffer from "bytebuffer";

@Container.injectable()
export class Serializer implements IBlockSerializer {
	@Container.inject(BINDINGS.Transaction.Utils)
	private readonly utils: Utils;

	public size(block: IBlock): number {
		let size = this.headerSize(block.data) + block.data.blockSignature.length / 2;

		for (const transaction of block.transactions) {
			size += 4 /* tx length */ + transaction.serialized.length;
		}

		return size;
	}

	public async serializeWithTransactions(block: IBlockData): Promise<Buffer> {
		const transactions: ITransactionData[] = block.transactions || [];
		block.numberOfTransactions = block.numberOfTransactions || transactions.length;

		const serializedHeader: Buffer = this.serialize(block);

		const buff: ByteBuffer = new ByteBuffer(serializedHeader.length + transactions.length * 4, true)
			.append(serializedHeader)
			.skip(transactions.length * 4);

		for (const [index, transaction] of transactions.entries()) {
			const serialized: Buffer = await this.utils.toBytes(transaction);
			buff.writeUint32(serialized.length, serializedHeader.length + index * 4);
			buff.append(serialized);
		}

		return buff.flip().toBuffer();
	}

	public serialize(block: IBlockData, includeSignature = true): Buffer {
		const buff: ByteBuffer = new ByteBuffer(512, true);

		this.serializeHeader(block, buff);

		if (includeSignature) {
			this.serializeSignature(block, buff);
		}

		return buff.flip().toBuffer();
	}

	private headerSize(block: IBlockData): number {
		return (
			4 + // version
			4 + // timestamp
			4 + // height
			32 + // previousBlock
			4 + // numberOfTransactions
			8 + // totalAmount
			8 + // totalFee
			8 + // reward
			4 + // payloadLength
			block.payloadHash.length / 2 +
			block.generatorPublicKey.length / 2
		);
	}

	private serializeHeader(block: IBlockData, buff: ByteBuffer): void {
		if (block.previousBlock.length !== 64) {
			throw new PreviousBlockIdFormatError(block.height, block.previousBlock);
		}

		block.previousBlockHex = block.previousBlock;

		buff.writeUint32(block.version);
		buff.writeUint32(block.timestamp);
		buff.writeUint32(block.height);
		buff.append(block.previousBlockHex, "hex");
		buff.writeUint32(block.numberOfTransactions);
		// The ByteBuffer types say we can't use strings but the code actually handles them.
		buff.writeUint64(block.totalAmount.toString());
		// The ByteBuffer types say we can't use strings but the code actually handles them.
		buff.writeUint64(block.totalFee.toString());
		// The ByteBuffer types say we can't use strings but the code actually handles them.
		buff.writeUint64(block.reward.toString());
		buff.writeUint32(block.payloadLength);
		buff.append(block.payloadHash, "hex");
		buff.append(block.generatorPublicKey, "hex");

		assert.strictEqual(buff.offset, this.headerSize(block));
	}

	private serializeSignature(block: IBlockData, buff: ByteBuffer): void {
		if (block.blockSignature) {
			buff.append(block.blockSignature, "hex");
		}
	}
}
