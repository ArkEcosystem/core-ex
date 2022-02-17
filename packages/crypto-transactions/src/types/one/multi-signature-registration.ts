import { BigNumber } from "@arkecosystem/utils";
import ByteBuffer from "bytebuffer";

import { IMultiSignatureLegacyAsset, ISerializeOptions, ITransactionData } from "../../contracts";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import { isException } from "../../utils";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

// @TODO: why was this abstract?
export class MultiSignatureRegistrationTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.MultiSignature;
    public static key = "multiSignature";
    public static version: number = 1;

    protected static defaultStaticFee: BigNumber = BigNumber.make("500000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiSignatureLegacy;
    }

    public getStaticFee(feeContext: { height?: number; data?: ITransactionData } = {}): BigNumber {
        if (feeContext.data?.asset?.multiSignatureLegacy) {
            return super
                .getStaticFee(feeContext)
                .times(feeContext.data.asset.multiSignatureLegacy.keysgroup.length + 1);
        }

        return super.getStaticFee(feeContext);
    }

    public verify(): boolean {
        return isException(this.data, this.configManager);
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        const legacyAsset: IMultiSignatureLegacyAsset = data.asset!.multiSignatureLegacy!;
        const joined: string = legacyAsset.keysgroup.map((k) => (k.startsWith("+") ? k.slice(1) : k)).join("");
        const keysgroupBuffer: Buffer = Buffer.from(joined, "hex");
        const buffer: ByteBuffer = new ByteBuffer(keysgroupBuffer.length + 3, true);

        buffer.writeByte(legacyAsset.min);
        buffer.writeByte(legacyAsset.keysgroup.length);
        buffer.writeByte(legacyAsset.lifetime);
        buffer.append(keysgroupBuffer, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const multiSignatureLegacy: IMultiSignatureLegacyAsset = { keysgroup: [], lifetime: 0, min: 0 };
        multiSignatureLegacy.min = buf.readUint8();

        const num: number = buf.readUint8();
        multiSignatureLegacy.lifetime = buf.readUint8();

        for (let index = 0; index < num; index++) {
            const key: string = buf.readBytes(33).toString("hex");
            multiSignatureLegacy.keysgroup.push(key);
        }

        data.asset = { multiSignatureLegacy };
    }
}
