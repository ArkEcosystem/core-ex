import { BigNumber } from "@arkecosystem/utils";

import { ConfigManager } from "./config";
import {
    IDeserializeOptions,
    IHelpers,
    ISerializeOptions,
    ITransaction,
    ITransactionData,
    ITransactionDeserializer,
    ITransactionJson,
    ITransactionSerializer,
    ITransactionTypeFactory,
    ITransactionVerifier,
} from "./contracts";
import {
    DuplicateParticipantInMultiSignatureError,
    InvalidTransactionBytesError,
    TransactionSchemaError,
    TransactionVersionError,
} from "./errors";
import { TransactionTypeFactory } from "./types";
import { isException } from "./utils";

export class TransactionFactory {
    readonly #config: ConfigManager;
    readonly #helpers: IHelpers;
    readonly #deserializer: ITransactionDeserializer;
    readonly #serializer: ITransactionSerializer;
    readonly #verifier: ITransactionVerifier;
    readonly #transactionTypeFactory: ITransactionTypeFactory;

    public constructor(
        config: ConfigManager,
        helpers: IHelpers,
        deserializer: ITransactionDeserializer,
        serializer: ITransactionSerializer,
        verifier: ITransactionVerifier,
        transactionTypeFactory: ITransactionTypeFactory,
    ) {
        this.#config = config;
        this.#helpers = helpers;
        this.#deserializer = deserializer;
        this.#serializer = serializer;
        this.#verifier = verifier;
        this.#transactionTypeFactory = transactionTypeFactory;
    }

    public fromHex(hex: string): ITransaction {
        return this.fromSerialized(hex);
    }

    public fromBytes(buffer: Buffer, strict = true, options: IDeserializeOptions = {}): ITransaction {
        return this.fromSerialized(buffer.toString("hex"), strict, options);
    }

    /**
     * Deserializes a transaction from `buffer` with the given `id`. It is faster
     * than `fromBytes` at the cost of vital safety checks (validation, verification and id calculation).
     *
     * NOTE: Only use this internally when it is safe to assume the buffer has already been
     * verified.
     */
    public fromBytesUnsafe(buffer: Buffer, id?: string): ITransaction {
        try {
            const options: IDeserializeOptions | ISerializeOptions = { acceptLegacyVersion: true };
            const transaction = this.#deserializer.deserialize(buffer, options);
            transaction.data.id = id || this.#helpers.getId(transaction.data, options);
            transaction.isVerified = true;

            return transaction;
        } catch (error) {
            throw new InvalidTransactionBytesError(error.message);
        }
    }

    public fromJson(json: ITransactionJson): ITransaction {
        const data: ITransactionData = ({ ...json } as unknown) as ITransactionData;
        data.amount = BigNumber.make(data.amount);
        data.fee = BigNumber.make(data.fee);

        return this.fromData(data);
    }

    public fromData(data: ITransactionData, strict = true, options: IDeserializeOptions = {}): ITransaction {
        const { value, error } = this.#verifier.verifySchema(data, strict);

        if (error && !isException(value, this.#config)) {
            throw new TransactionSchemaError(error);
        }

        const transaction: ITransaction = this.#transactionTypeFactory.create(value);

        const { version } = transaction.data;
        if (version === 1) {
            this.#deserializer.applyV1Compatibility(transaction.data);
        }

        this.#serializer.serialize(transaction);

        return this.fromBytes(transaction.serialized, strict, options);
    }

    private fromSerialized(serialized: string, strict = true, options: IDeserializeOptions = {}): ITransaction {
        try {
            const transaction = this.#deserializer.deserialize(serialized, options);
            transaction.data.id = this.#helpers.getId(transaction.data, options);

            const { value, error } = this.#verifier.verifySchema(transaction.data, strict);

            if (error && !isException(value, this.#config)) {
                throw new TransactionSchemaError(error);
            }

            transaction.isVerified = transaction.verify(options);

            return transaction;
        } catch (error) {
            if (
                error instanceof TransactionVersionError ||
                error instanceof TransactionSchemaError ||
                error instanceof DuplicateParticipantInMultiSignatureError
            ) {
                throw error;
            }

            throw new InvalidTransactionBytesError(error.message);
        }
    }
}
