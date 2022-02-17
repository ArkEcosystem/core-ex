import { ConfigManager } from "./config";
import {
    IHelpers,
    IMultiSignatureAsset,
    ISchemaValidationResult,
    ITransactionData,
    ITransactionTypeFactory,
    IVerifyOptions,
} from "./contracts";
import { Hash } from "./crypto/hash";
import { DuplicateParticipantInMultiSignatureError, InvalidMultiSignatureAssetError } from "./errors";
import { isException } from "./utils";
import { TransactionValidator } from "./validator";

export class TransactionVerifier {
    readonly #config: ConfigManager;
    readonly #transactionTypeFactory!: ITransactionTypeFactory;
    #helpers!: IHelpers;
    #validator!: TransactionValidator;

    public constructor(config: ConfigManager, transactionTypeFactory: ITransactionTypeFactory) {
        this.#config = config;
        this.#transactionTypeFactory = transactionTypeFactory;
    }

    public initialize(helpers: IHelpers, validator: TransactionValidator): void {
        this.#helpers = helpers;
        this.#validator = validator;
    }

    public verify(data: ITransactionData, options?: IVerifyOptions): boolean {
        if (isException(data, this.#config)) {
            return true;
        }

        if (this.#config.getMilestone().aip11 && (!data.version || data.version === 1)) {
            return false;
        }

        return this.verifyHash(data, options?.disableVersionCheck);
    }

    public verifySecondSignature(transaction: ITransactionData, publicKey: string, options?: IVerifyOptions): boolean {
        const secondSignature: string | undefined = transaction.secondSignature || transaction.signSignature;

        if (!secondSignature) {
            return false;
        }

        const hash: Buffer = this.#helpers.toHash(transaction, {
            disableVersionCheck: options?.disableVersionCheck,
            excludeSecondSignature: true,
        });
        return this.internalVerifySignature(hash, secondSignature, publicKey);
    }

    public verifySignatures(transaction: ITransactionData, multiSignature: IMultiSignatureAsset): boolean {
        if (!multiSignature) {
            throw new InvalidMultiSignatureAssetError();
        }

        const { publicKeys, min }: IMultiSignatureAsset = multiSignature;
        const { signatures }: ITransactionData = transaction;

        const hash: Buffer = this.#helpers.toHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
            excludeMultiSignature: true,
        });

        const publicKeyIndexes: { [index: number]: boolean } = {};
        let verified: boolean = false;
        let verifiedSignatures: number = 0;

        if (signatures) {
            for (let i = 0; i < signatures.length; i++) {
                const signature: string = signatures[i];
                const publicKeyIndex: number = parseInt(signature.slice(0, 2), 16);

                if (!publicKeyIndexes[publicKeyIndex]) {
                    publicKeyIndexes[publicKeyIndex] = true;
                } else {
                    throw new DuplicateParticipantInMultiSignatureError();
                }

                const partialSignature: string = signature.slice(2, 130);
                const publicKey: string = publicKeys[publicKeyIndex];

                if (Hash.verifySchnorr(hash, partialSignature, publicKey)) {
                    verifiedSignatures++;
                }

                if (verifiedSignatures === min) {
                    verified = true;
                    break;
                } else if (signatures.length - (i + 1 - verifiedSignatures) < min) {
                    break;
                }
            }
        }

        return verified;
    }

    public verifyHash(data: ITransactionData, disableVersionCheck = false): boolean {
        const { signature, senderPublicKey } = data;

        if (!signature || !senderPublicKey) {
            return false;
        }

        const hash: Buffer = this.#helpers.toHash(data, {
            disableVersionCheck,
            excludeSignature: true,
            excludeSecondSignature: true,
        });

        return this.internalVerifySignature(hash, signature, senderPublicKey);
    }

    public verifySchema(data: ITransactionData, strict = true): ISchemaValidationResult {
        const transactionType = this.#transactionTypeFactory.get(data.type, data.typeGroup, data.version);

        if (!transactionType) {
            throw new Error();
        }

        const { $id } = transactionType.getSchema();

        return this.#validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }

    private internalVerifySignature(hash: Buffer, signature: string, publicKey: string): boolean {
        const isSchnorr = Buffer.from(signature, "hex").byteLength === 64;
        if (isSchnorr) {
            return Hash.verifySchnorr(hash, signature, publicKey);
        }

        return Hash.verifyECDSA(hash, signature, publicKey);
    }
}
