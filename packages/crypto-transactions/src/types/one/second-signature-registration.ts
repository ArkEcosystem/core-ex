import { BigNumber } from "@arkecosystem/utils";
import ByteBuffer from "bytebuffer";

import { ISerializeOptions } from "../../contracts";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

// @TODO: why was this abstract?
export class SecondSignatureRegistrationTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.SecondSignature;
    public static key = "secondSignature";
    public static version: number = 1;

    protected static defaultStaticFee: BigNumber = BigNumber.make("500000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.secondSignature;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;
        const buffer: ByteBuffer = new ByteBuffer(33, true);

        if (data.asset && data.asset.signature) {
            buffer.append(data.asset.signature.publicKey, "hex");
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        data.asset = {
            signature: {
                publicKey: buf.readBytes(33).toString("hex"),
            },
        };
    }
}
