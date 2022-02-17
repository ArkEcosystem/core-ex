import { ConfigManager } from "src/config";

import { ITransaction, ITransactionData, ITransactionVerifier } from "../contracts";
import { UnkownTransactionError } from "../errors";
import { InternalTransactionType } from "./internal-transaction-type";
import { Transaction } from "./transaction";

type TransactionConstructor = typeof Transaction;

export class TransactionTypeFactory {
    readonly #config: ConfigManager;
    #verifier!: ITransactionVerifier;
    #transactionTypes!: Map<InternalTransactionType, Map<number, TransactionConstructor>>;

    public constructor(config: ConfigManager) {
        this.#config = config;
    }

    public setTypes(transactionTypes: Map<InternalTransactionType, Map<number, TransactionConstructor>>): void {
        this.#transactionTypes = transactionTypes;
    }

    public setVerifier(verifier: ITransactionVerifier): void {
        this.#verifier = verifier;
    }

    public create(data: ITransactionData): ITransaction {
        const instance: ITransaction = new (this.get(data.type, data.typeGroup, data.version) as any)(
            this.#config,
            this.#verifier,
        ) as ITransaction;
        instance.data = data;
        instance.data.version = data.version || 1;

        return instance;
    }

    public get(type: number, typeGroup?: number, version?: number): TransactionConstructor | undefined {
        const internalType: InternalTransactionType = InternalTransactionType.from(type, typeGroup);

        if (!this.#transactionTypes.has(internalType)) {
            throw new UnkownTransactionError(internalType.toString());
        }

        // Either there is a match for the provided version or use the first available constructor as a fallback
        const constructor: TransactionConstructor | undefined = this.#transactionTypes
            .get(internalType)
            ?.get(version || 1);
        return constructor ?? [...this.#transactionTypes.get(internalType)!.values()][0];
    }
}
