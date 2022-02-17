import { ConfigManager } from "./config";
import { ISerializeOptions, ITransactionData, ITransactionTypeFactory } from "./contracts";
import { ITransactionSerializer } from "./contracts";
import { HashAlgorithms } from "./crypto";
import { AddressNetworkError } from "./errors";
import { TransactionTypeFactory } from "./types/factory";
import { isException } from "./utils";
import { TransactionVerifier } from "./verifier";

export class Helpers {
    readonly #config: ConfigManager;
    readonly #serializer: ITransactionSerializer;
    readonly #transactionTypeFactory: ITransactionTypeFactory;

    public constructor(
        config: ConfigManager,
        serializer: ITransactionSerializer,
        transactionTypeFactory: ITransactionTypeFactory,
    ) {
        this.#config = config;
        this.#serializer = serializer;
        this.#transactionTypeFactory = transactionTypeFactory;
    }

    public toBytes(data: ITransactionData): Buffer {
        return this.#serializer.serialize(this.#transactionTypeFactory.create(data));
    }

    public toHash(transaction: ITransactionData, options?: ISerializeOptions): Buffer {
        return HashAlgorithms.sha256(this.#serializer.getBytes(transaction, options));
    }

    public getId(transaction: ITransactionData, options: ISerializeOptions = {}): string {
        const id: string = this.toHash(transaction, options).toString("hex");

        // WORKAROUND:
        // A handful of mainnet transactions have an invalid recipient. Due to a
        // refactor of the Address network byte validation it is no longer
        // trivially possible to handle them. If an invalid address is encountered
        // during transfer serialization, the error is bubbled up to defer the
        // `AddressNetworkByteError` until the actual id is available to call
        // `isException`.
        if (options.addressError && !isException({ id }, this.#config)) {
            throw new AddressNetworkError(options.addressError);
        }

        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = this.#config.get("exceptions");

        if (transactionIdFixTable && transactionIdFixTable[id]) {
            return transactionIdFixTable[id];
        }

        return id;
    }
}
