import assert from "assert";
import ByteBuffer from "bytebuffer";

import { PreviousBlockIdFormatError } from "@arkecosystem/crypto-errors";
import { IBlock, IBlockData, ITransactionData } from "@arkecosystem/crypto-contracts";
import { Configuration } from "@arkecosystem/crypto-config";
import { Utils } from "@arkecosystem/crypto-transaction";
import { Block } from "./block";

export class Serializer {
	readonly #configuration: Configuration;

	public constructor(configuration: Configuration) {
		this.#configuration = configuration;
	}

	public size(block: IBlock): number {
		let size = this.headerSize(block.data) + block.data.blockSignature.length / 2;

		for (const transaction of block.transactions) {
			size += 4 /* tx length */ + transaction.serialized.length;
		}

		return size;
	}

	public serializeWithTransactions(block: IBlockData): Buffer {
		const transactions: ITransactionData[] = block.transactions || [];
		block.numberOfTransactions = block.numberOfTransactions || transactions.length;

		const serializedHeader: Buffer = this.serialize(block);

		const buff: ByteBuffer = new ByteBuffer(serializedHeader.length + transactions.length * 4, true)
			.append(serializedHeader)
			.skip(transactions.length * 4);

		for (const [i, transaction] of transactions.entries()) {
			const serialized: Buffer = Utils.toBytes(transaction);
			buff.writeUint32(serialized.length, serializedHeader.length + i * 4);
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
		const constants = this.#configuration.getMilestone(block.height - 1 || 1);

		return (
			4 + // version
			4 + // timestamp
			4 + // height
			(constants.block.idFullSha256 ? 32 : 8) + // previousBlock
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
		const constants = this.#configuration.getMilestone(block.height - 1 || 1);

		if (constants.block.idFullSha256) {
			if (block.previousBlock.length !== 64) {
				throw new PreviousBlockIdFormatError(block.height, block.previousBlock);
			}

			block.previousBlockHex = block.previousBlock;
		} else {
			// @ts-ignore
			block.previousBlockHex = new Block(this.#configuration, {}).toBytesHex(block.previousBlock);
		}

		buff.writeUint32(block.version);
		buff.writeUint32(block.timestamp);
		buff.writeUint32(block.height);
		buff.append(block.previousBlockHex, "hex");
		buff.writeUint32(block.numberOfTransactions);
		// @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
		buff.writeUint64(block.totalAmount.toString());
		// @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
		buff.writeUint64(block.totalFee.toString());
		// @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
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