import { Contracts } from "@arkecosystem/crypto-identities";

import { ISerializeOptions, ITransactionData } from "./contracts";
import { Hash } from "./crypto";
import { Helpers } from "./helpers";
import { numberToHex } from "./utils";

export class TransactionSigner {
    readonly #helpers: Helpers;

    public constructor(helpers: Helpers) {
        this.#helpers = helpers;
    }

    public sign(transaction: ITransactionData, keys: Contracts.KeyPair, options?: ISerializeOptions): string {
        if (!options || (options.excludeSignature === undefined && options.excludeSecondSignature === undefined)) {
            options = { excludeSignature: true, excludeSecondSignature: true, ...options };
        }

        const hash: Buffer = this.#helpers.toHash(transaction, options);
        const signature: string =
            transaction.version && transaction.version > 1 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

        if (!transaction.signature && !options.excludeMultiSignature) {
            transaction.signature = signature;
        }

        return signature;
    }

    public secondSign(transaction: ITransactionData, keys: Contracts.KeyPair): string {
        const hash: Buffer = this.#helpers.toHash(transaction, { excludeSecondSignature: true });
        const signature: string =
            transaction.version && transaction.version > 1 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }

        return signature;
    }

    public multiSign(transaction: ITransactionData, keys: Contracts.KeyPair, index = -1): string {
        if (!transaction.signatures) {
            transaction.signatures = [];
        }

        index = index === -1 ? transaction.signatures.length : index;

        const hash: Buffer = this.#helpers.toHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
            excludeMultiSignature: true,
        });

        const signature: string = Hash.signSchnorr(hash, keys);
        const indexedSignature = `${numberToHex(index)}${signature}`;
        transaction.signatures.push(indexedSignature);

        return indexedSignature;
    }
}
