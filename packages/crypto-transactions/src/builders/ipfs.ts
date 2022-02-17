import { BigNumber } from "@arkecosystem/utils";

import { ITransactionData } from "../contracts";
import { Two } from "../types";
import { TransactionBuilder } from "./transaction";

export class IPFSBuilder extends TransactionBuilder<IPFSBuilder> {
    public constructor(dependencies) {
        super(dependencies);

        this.data.type = Two.IpfsTransaction.type;
        this.data.typeGroup = Two.IpfsTransaction.typeGroup;
        this.data.fee = new Two.IpfsTransaction(this.config, this.verifier).getStaticFee();
        this.data.amount = BigNumber.ZERO;
        this.data.asset = {};
    }

    public ipfsAsset(ipfsId: string): IPFSBuilder {
        this.data.asset = {
            ipfs: ipfsId,
        };

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): IPFSBuilder {
        return this;
    }
}
