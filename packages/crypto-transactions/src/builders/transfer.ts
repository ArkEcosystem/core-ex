import { BigNumber } from "@arkecosystem/utils";

import { ITransactionData } from "../contracts";
import { Two } from "../types";
import { TransactionBuilder } from "./transaction";

export class TransferBuilder extends TransactionBuilder<TransferBuilder> {
    public constructor(dependencies) {
        super(dependencies);

        this.data.type = Two.TransferTransaction.type;
        this.data.typeGroup = Two.TransferTransaction.typeGroup;
        this.data.fee = new Two.TransferTransaction(this.config, this.verifier).getStaticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.expiration = 0;
    }

    public expiration(expiration: number): TransferBuilder {
        this.data.expiration = expiration;

        return this.instance();
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        struct.vendorField = this.data.vendorField;
        struct.expiration = this.data.expiration;

        return struct;
    }

    protected instance(): TransferBuilder {
        return this;
    }
}
