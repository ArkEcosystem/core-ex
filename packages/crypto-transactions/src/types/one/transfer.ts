import { Address } from "@arkecosystem/crypto-identities";
import { BigNumber } from "@arkecosystem/utils";
import ByteBuffer from "bytebuffer";

import { ISerializeOptions } from "../../contracts";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

// @TODO: why was this abstract?
export class TransferTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.Transfer;
    public static key = "transfer";
    public static version: number = 1;

    protected static defaultStaticFee: BigNumber = BigNumber.make("10000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.transfer;
    }

    public hasVendorField(): boolean {
        return true;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;
        const buffer: ByteBuffer = new ByteBuffer(24, true);
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(data.amount.toString());
        buffer.writeUint32(data.expiration || 0);

        if (data.recipientId) {
            const { addressBuffer, addressError } = Address.toBuffer(data.recipientId, {
                pubKeyHash: this.configManager.get("network.pubKeyHash"),
            });

            if (options) {
                options.addressError = addressError;
            }

            buffer.append(addressBuffer);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = BigNumber.make(buf.readUint64().toString());
        data.expiration = buf.readUint32();
        data.recipientId = Address.fromBuffer(buf.readBytes(21).toBuffer());
    }
}
