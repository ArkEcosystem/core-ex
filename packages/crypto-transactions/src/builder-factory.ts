import { DelegateRegistrationBuilder } from "./builders/delegate-registration";
import { DelegateResignationBuilder } from "./builders/delegate-resignation";
import { HtlcClaimBuilder } from "./builders/htlc-claim";
import { HtlcLockBuilder } from "./builders/htlc-lock";
import { HtlcRefundBuilder } from "./builders/htlc-refund";
import { IPFSBuilder } from "./builders/ipfs";
import { MultiPaymentBuilder } from "./builders/multi-payment";
import { MultiSignatureBuilder } from "./builders/multi-signature";
import { SecondSignatureBuilder } from "./builders/second-signature";
import { TransferBuilder } from "./builders/transfer";
import { VoteBuilder } from "./builders/vote";

export * from "./builders/transaction";

export class TransactionBuilderFactory {
    readonly #dependencies: any;

    public constructor(dependencies) {
        this.#dependencies = dependencies;
    }

    public transfer(): TransferBuilder {
        return new TransferBuilder(this.#dependencies);
    }

    public secondSignature(): SecondSignatureBuilder {
        return new SecondSignatureBuilder(this.#dependencies);
    }

    public delegateRegistration(): DelegateRegistrationBuilder {
        return new DelegateRegistrationBuilder(this.#dependencies);
    }

    public vote(): VoteBuilder {
        return new VoteBuilder(this.#dependencies);
    }

    public multiSignature(): MultiSignatureBuilder {
        return new MultiSignatureBuilder(this.#dependencies);
    }

    public ipfs(): IPFSBuilder {
        return new IPFSBuilder(this.#dependencies);
    }

    public multiPayment(): MultiPaymentBuilder {
        return new MultiPaymentBuilder(this.#dependencies);
    }

    public delegateResignation(): DelegateResignationBuilder {
        return new DelegateResignationBuilder(this.#dependencies);
    }

    public htlcLock(): HtlcLockBuilder {
        return new HtlcLockBuilder(this.#dependencies);
    }

    public htlcClaim(): HtlcClaimBuilder {
        return new HtlcClaimBuilder(this.#dependencies);
    }

    public htlcRefund(): HtlcRefundBuilder {
        return new HtlcRefundBuilder(this.#dependencies);
    }
}
