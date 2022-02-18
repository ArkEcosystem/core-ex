import { IKeyPair, IKeyPairFactory as Contract } from "@arkecosystem/crypto-contracts";
import { SHA256 } from "bcrypto";
import { deriveEIP2334Key } from "bls12-381-keygen";
import { getPublicKey } from '@noble/bls12-381';

export class KeyPairFactory implements Contract {
	public fromMnemonic(mnemonic: string): IKeyPair {
		return this.#fromPrivateKey(deriveEIP2334Key(SHA256.digest(Buffer.from(mnemonic, "utf8")), 'signing', 0).key);
	}

	public fromPrivateKey(privateKey: Buffer): IKeyPair {
		return this.#fromPrivateKey(privateKey);
	}

	#fromPrivateKey(privateKey: Uint8Array): IKeyPair {
		return {
			compressed: true,
			privateKey: Buffer.from(privateKey).toString("hex"),
			publicKey: Buffer.from(getPublicKey(privateKey)).toString("hex"),
		};
	}
}
