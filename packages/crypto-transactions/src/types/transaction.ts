import { Address } from "@arkecosystem/crypto-identities";
import { BigNumber } from "@arkecosystem/utils";
import ByteBuffer from "bytebuffer";

import { ConfigManager } from "../config";
import {
    ISchemaValidationResult,
    ISerializeOptions,
    ITransaction,
    ITransactionData,
    ITransactionJson,
    ITransactionVerifier,
} from "../contracts";
import { TransactionTypeGroup } from "../enums";
import { NotImplemented } from "../errors";
import { TransactionSchema } from "./schemas";

export abstract class Transaction implements ITransaction {
    public static type: number | undefined = undefined;
    public static typeGroup: number | undefined = undefined;
    public static version: number = 1;
    public static key: string | undefined = undefined;

    protected static defaultStaticFee: BigNumber = BigNumber.ZERO;

    public isVerified: boolean = false;
    // @ts-ignore - todo: this is public but not initialised on creation, either make it private or declare it as undefined
    public data: ITransactionData;
    // @ts-ignore - todo: this is public but not initialised on creation, either make it private or declare it as undefined
    public serialized: Buffer;
    // @ts-ignore - todo: this is public but not initialised on creation, either make it private or declare it as undefined
    public timestamp: number;

    protected readonly configManager: ConfigManager;
    protected readonly verifier: ITransactionVerifier;

    public constructor(configManager: ConfigManager, verifier: ITransactionVerifier) {
        this.configManager = configManager;
        this.verifier = verifier;
    }

    public static getSchema(): TransactionSchema {
        throw new NotImplemented();
    }

    public getStaticFee(feeContext: { height?: number; data?: ITransactionData } = {}): BigNumber {
        const milestones = this.configManager.getMilestone(feeContext.height);
        if (milestones.fees && milestones.fees.staticFees && this.key) {
            const fee: any = milestones.fees.staticFees[this.key];

            if (fee !== undefined) {
                return BigNumber.make(fee);
            }
        }

        return Transaction.defaultStaticFee;
    }

    public verify(options?: ISerializeOptions): boolean {
        return this.verifier.verify(this.data, options);
    }

    public verifySecondSignature(publicKey: string): boolean {
        return this.verifier.verifySecondSignature(this.data, publicKey);
    }

    public verifySchema(): ISchemaValidationResult {
        return this.verifier.verifySchema(this.data);
    }

    public toJson(): ITransactionJson {
        const data: ITransactionJson = JSON.parse(JSON.stringify(this.data));

        if (data.typeGroup === TransactionTypeGroup.Core && data.version === 1) {
            delete data.typeGroup;
        }

        if (data.version === 1) {
            delete data.nonce;
        } else {
            delete data.timestamp;
        }

        return data;
    }

    public toString(): string {
        const parts: string[] = [];

        if (this.data.senderPublicKey && this.data.nonce) {
            parts.push(
                `${Address.fromPublicKey(this.data.senderPublicKey, {
                    pubKeyHash: this.configManager.get("network.pubKeyHash"),
                })}#${this.data.nonce}`,
            );
        } else if (this.data.senderPublicKey) {
            parts.push(
                `${Address.fromPublicKey(this.data.senderPublicKey, {
                    pubKeyHash: this.configManager.get("network.pubKeyHash"),
                })}`,
            );
        }

        if (this.data.id) {
            parts.push(this.data.id.slice(-8));
        }

        parts.push(`${this.key[0].toUpperCase()}${this.key.slice(1)} v${this.data.version}`);

        return parts.join(" ");
    }

    public hasVendorField(): boolean {
        return false;
    }

    public abstract serialize(): ByteBuffer | undefined;
    public abstract deserialize(buf: ByteBuffer): void;

    public get id(): string | undefined {
        return this.data.id;
    }

    public get type(): number {
        return this.data.type;
    }

    public get typeGroup(): number | undefined {
        return this.data.typeGroup;
    }

    public get verified(): boolean {
        return this.isVerified;
    }

    public get key(): string {
        return (this as any).__proto__.constructor.key;
    }

    public get staticFee(): BigNumber {
        return (this as any).__proto__.constructor.staticFee({ data: this.data });
    }
}
