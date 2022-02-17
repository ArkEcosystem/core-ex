import { BigNumber } from "@arkecosystem/utils";

import { ITransactionData } from "../contracts";
import { Two } from "../types";
import { TransactionBuilder } from "./transaction";

export class VoteBuilder extends TransactionBuilder<VoteBuilder> {
    public constructor(dependencies) {
        super(dependencies);

        this.data.type = Two.VoteTransaction.type;
        this.data.typeGroup = Two.VoteTransaction.typeGroup;
        this.data.fee = new Two.VoteTransaction(this.config, this.verifier).getStaticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = { votes: [] };

        this.signWithSenderAsRecipient = true;
    }

    public votesAsset(votes: string[]): VoteBuilder {
        if (this.data.asset && this.data.asset.votes) {
            this.data.asset.votes = votes;
        }

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): VoteBuilder {
        return this;
    }
}
