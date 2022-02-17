import { BigNumber } from "@arkecosystem/utils";

import { ITransactionData } from "../contracts";
import { Two } from "../types";
import { TransactionBuilder } from "./transaction";

export class DelegateResignationBuilder extends TransactionBuilder<DelegateResignationBuilder> {
    public constructor(dependencies) {
        super(dependencies);

        this.data.type = Two.DelegateResignationTransaction.type;
        this.data.typeGroup = Two.DelegateResignationTransaction.typeGroup;
        this.data.version = 2;
        this.data.fee = new Two.DelegateResignationTransaction(this.config, this.verifier).getStaticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.senderPublicKey = undefined;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        return struct;
    }

    protected instance(): DelegateResignationBuilder {
        return this;
    }
}
