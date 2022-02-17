import { BigNumber } from "@arkecosystem/utils";
import ByteBuffer from "bytebuffer";

import { IMultiSignatureAsset, ISerializeOptions, ITransactionData } from "../../contracts";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export class MultiSignatureRegistrationTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.MultiSignature;
    public static key = "multiSignature";
    public static version: number = 2;

    protected static defaultStaticFee: BigNumber = BigNumber.make("500000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiSignature;
    }

    public getStaticFee(feeContext: { height?: number; data?: ITransactionData } = {}): BigNumber {
        if (feeContext.data?.asset?.multiSignature) {
            return super.getStaticFee(feeContext).times(feeContext.data.asset.multiSignature.publicKeys.length + 1);
        }

        return super.getStaticFee(feeContext);
    }

    public verify(): boolean {
        return this.configManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;
        const { min, publicKeys } = data.asset!.multiSignature!;
        const buffer: ByteBuffer = new ByteBuffer(2 + publicKeys.length * 33);

        buffer.writeUint8(min);
        buffer.writeUint8(publicKeys.length);

        for (const publicKey of publicKeys) {
            buffer.append(publicKey, "hex");
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const multiSignature: IMultiSignatureAsset = { publicKeys: [], min: 0 };
        multiSignature.min = buf.readUint8();

        const count = buf.readUint8();
        for (let i = 0; i < count; i++) {
            const publicKey = buf.readBytes(33).toString("hex");
            multiSignature.publicKeys.push(publicKey);
        }

        data.asset = { multiSignature };
    }
}
