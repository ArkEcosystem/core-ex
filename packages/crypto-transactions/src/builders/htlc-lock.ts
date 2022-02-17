import { BigNumber } from "@arkecosystem/utils";

import { IHtlcLockAsset, ITransactionData } from "../contracts";
import { Two } from "../types";
import { TransactionBuilder } from "./transaction";

export class HtlcLockBuilder extends TransactionBuilder<HtlcLockBuilder> {
    public constructor(dependencies) {
        super(dependencies);

        this.data.type = Two.HtlcLockTransaction.type;
        this.data.typeGroup = Two.HtlcLockTransaction.typeGroup;
        this.data.recipientId = undefined;
        this.data.amount = BigNumber.ZERO;
        this.data.fee = new Two.HtlcLockTransaction(this.config, this.verifier).getStaticFee();
        this.data.vendorField = undefined;
        this.data.asset = {};
    }

    public htlcLockAsset(lockAsset: IHtlcLockAsset): HtlcLockBuilder {
        this.data.asset = {
            lock: lockAsset,
        };

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.recipientId = this.data.recipientId;
        struct.amount = this.data.amount;
        struct.vendorField = this.data.vendorField;
        struct.asset = JSON.parse(JSON.stringify(this.data.asset));
        return struct;
    }

    public expiration(expiration: number): HtlcLockBuilder {
        return this;
    }

    protected instance(): HtlcLockBuilder {
        return this;
    }
}
