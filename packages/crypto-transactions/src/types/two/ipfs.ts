import { BigNumber } from "@arkecosystem/utils";
import { base58 } from "bstring";
import ByteBuffer from "bytebuffer";

import { ISerializeOptions } from "../../contracts";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

// @TODO: why was this abstract?
export class IpfsTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.Ipfs;
    public static key = "ipfs";
    public static version: number = 2;

    protected static defaultStaticFee: BigNumber = BigNumber.make("500000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.ipfs;
    }

    public verify(): boolean {
        return this.configManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        if (data.asset) {
            const ipfsBuffer: Buffer = base58.decode(data.asset.ipfs);
            const buffer: ByteBuffer = new ByteBuffer(ipfsBuffer.length, true);

            buffer.append(ipfsBuffer, "hex");

            return buffer;
        }

        return undefined;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const hashFunction: number = buf.readUint8();
        const ipfsHashLength: number = buf.readUint8();
        const ipfsHash: Buffer = buf.readBytes(ipfsHashLength).toBuffer();

        const buffer: Buffer = Buffer.alloc(ipfsHashLength + 2);
        buffer.writeUInt8(hashFunction, 0);
        buffer.writeUInt8(ipfsHashLength, 1);
        buffer.fill(ipfsHash, 2);

        data.asset = {
            ipfs: base58.encode(buffer),
        };
    }
}
