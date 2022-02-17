import { AddressFactory as Contract, IKeyPair, KeyPairFactory } from "@arkecosystem/crypto-contracts";
import { bech32 } from "@scure/base";

export class AddressFactory implements Contract {
    readonly #network: any;
    readonly #keyPairFactory: KeyPairFactory;

    public constructor(network: any, keyPairFactory: KeyPairFactory) {
        this.#network = network;
        this.#keyPairFactory = keyPairFactory;
    }

    public fromMnemonic(passphrase: string): string {
        return this.fromPublicKey(this.#keyPairFactory.fromMnemonic(passphrase).publicKey);
    }

    public fromPublicKey(publicKey: string): string {
        return bech32.encode(this.#network.prefix, bech32.toWords(Buffer.from(publicKey, "hex")));
    }

    public fromPrivateKey(privateKey: IKeyPair): string {
        return this.fromPublicKey(privateKey.publicKey);
    }

    public validate(address: string): boolean {
        try {
            bech32.decode(address);

            return true;
        } catch (error) {
            return false;
        }
    }
}
