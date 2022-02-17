import { Address, KeyPair, Keys } from "@arkecosystem/crypto-identities";
import { BigNumber } from "@arkecosystem/utils";

import { ConfigManager } from "../config";
import { ITransaction, ITransactionData, ITransactionVerifier } from "../contracts";
import { Slots } from "../crypto";
import { TransactionTypeGroup } from "../enums";
import { MissingTransactionSignatureError, VendorFieldLengthExceededError } from "../errors";
import { TransactionFactory } from "../factory";
import { Helpers } from "../helpers";
import { TransactionSigner } from "../signer";
import { maxVendorFieldLength } from "../utils";

export abstract class TransactionBuilder<TBuilder extends TransactionBuilder<TBuilder>> {
    readonly config: ConfigManager;
    readonly factory: TransactionFactory;
    readonly signer: TransactionSigner;
    readonly verifier: ITransactionVerifier;
    readonly helpers: Helpers;

    public data: ITransactionData;

    protected signWithSenderAsRecipient = false;

    private disableVersionCheck = false;

    public constructor({ config, factory, signer, verifier, helpers }) {
        this.config = config;
        this.factory = factory;
        this.signer = signer;
        this.verifier = verifier;
        this.helpers = helpers;

        this.data = {
            id: undefined,
            timestamp: new Slots(config).getTime(),
            typeGroup: TransactionTypeGroup.Test,
            nonce: BigNumber.ZERO,
            version: this.config.getMilestone().aip11 ? 0x02 : 0x01,
        } as ITransactionData;
    }

    public build(data: Partial<ITransactionData> = {}): ITransaction {
        return this.factory.fromData({ ...this.data, ...data }, false, {
            disableVersionCheck: this.disableVersionCheck,
        });
    }

    public version(version: number): TBuilder {
        this.data.version = version;
        this.disableVersionCheck = true;
        return this.instance();
    }

    public typeGroup(typeGroup: number): TBuilder {
        this.data.typeGroup = typeGroup;

        return this.instance();
    }

    public nonce(nonce: string): TBuilder {
        if (nonce) {
            this.data.nonce = BigNumber.make(nonce);
        }

        return this.instance();
    }

    public network(network: number): TBuilder {
        this.data.network = network;

        return this.instance();
    }

    public fee(fee: string): TBuilder {
        if (fee) {
            this.data.fee = BigNumber.make(fee);
        }

        return this.instance();
    }

    public amount(amount: string): TBuilder {
        this.data.amount = BigNumber.make(amount);

        return this.instance();
    }

    public recipientId(recipientId: string): TBuilder {
        this.data.recipientId = recipientId;

        return this.instance();
    }

    public senderPublicKey(publicKey: string): TBuilder {
        this.data.senderPublicKey = publicKey;

        return this.instance();
    }

    public vendorField(vendorField: string): TBuilder {
        const limit: number = maxVendorFieldLength(this.config);

        if (vendorField) {
            if (Buffer.from(vendorField).length > limit) {
                throw new VendorFieldLengthExceededError(limit);
            }

            this.data.vendorField = vendorField;
        }

        return this.instance();
    }

    public sign(passphrase: string): TBuilder {
        const keys: KeyPair = Keys.fromPassphrase(passphrase);
        return this.signWithKeyPair(keys);
    }

    public signWithWif(wif: string, networkWif?: number): TBuilder {
        const keys: KeyPair = Keys.fromWIF(wif, {
            wif: networkWif || this.config.get("network.wif"),
        });

        return this.signWithKeyPair(keys);
    }

    public secondSign(secondPassphrase: string): TBuilder {
        return this.secondSignWithKeyPair(Keys.fromPassphrase(secondPassphrase));
    }

    public secondSignWithWif(wif: string, networkWif?: number): TBuilder {
        const keys = Keys.fromWIF(wif, {
            wif: networkWif || this.config.get("network.wif"),
        });

        return this.secondSignWithKeyPair(keys);
    }

    public multiSign(passphrase: string, index: number): TBuilder {
        const keys: KeyPair = Keys.fromPassphrase(passphrase);
        return this.multiSignWithKeyPair(index, keys);
    }

    public multiSignWithWif(index: number, wif: string, networkWif?: number): TBuilder {
        const keys = Keys.fromWIF(wif, {
            wif: networkWif || this.config.get("network.wif"),
        });

        return this.multiSignWithKeyPair(index, keys);
    }

    public verify(): boolean {
        return this.verifier.verifyHash(this.data, this.disableVersionCheck);
    }

    public getStruct(): ITransactionData {
        if (!this.data.senderPublicKey || (!this.data.signature && !this.data.signatures)) {
            throw new MissingTransactionSignatureError();
        }

        const struct: ITransactionData = {
            id: this.helpers.getId(this.data).toString(),
            signature: this.data.signature,
            secondSignature: this.data.secondSignature,
            version: this.data.version,
            type: this.data.type,
            fee: this.data.fee,
            senderPublicKey: this.data.senderPublicKey,
            network: this.data.network,
        } as ITransactionData;

        if (this.data.version === 1) {
            struct.timestamp = this.data.timestamp;
        } else {
            struct.typeGroup = this.data.typeGroup;
            struct.nonce = this.data.nonce;
        }

        if (Array.isArray(this.data.signatures)) {
            struct.signatures = this.data.signatures;
        }

        return struct;
    }

    private signWithKeyPair(keys: KeyPair): TBuilder {
        this.data.senderPublicKey = keys.publicKey;

        if (this.signWithSenderAsRecipient) {
            this.data.recipientId = Address.fromPublicKey(keys.publicKey, { pubKeyHash: this.data.network! });
        }

        this.data.signature = this.signer.sign(this.getSigningObject(), keys, {
            disableVersionCheck: this.disableVersionCheck,
        });

        return this.instance();
    }

    private secondSignWithKeyPair(keys: KeyPair): TBuilder {
        this.data.secondSignature = this.signer.secondSign(this.getSigningObject(), keys);
        return this.instance();
    }

    private multiSignWithKeyPair(index: number, keys: KeyPair): TBuilder {
        if (!this.data.signatures) {
            this.data.signatures = [];
        }

        this.version(2);
        this.signer.multiSign(this.getSigningObject(), keys, index);

        return this.instance();
    }

    private getSigningObject(): ITransactionData {
        const data: ITransactionData = {
            ...this.data,
        };

        for (const key of Object.keys(data)) {
            if (["model", "network", "id"].includes(key)) {
                delete data[key];
            }
        }

        return data;
    }

    protected abstract instance(): TBuilder;
}
