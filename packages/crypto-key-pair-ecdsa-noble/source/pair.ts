import { IKeyPair, IKeyPairFactory as Contract } from "@arkecosystem/crypto-contracts";
import { getPublicKey, utils } from "@noble/secp256k1";
import WIF from "wif";

export class KeyPairFactory implements Contract {
	public async fromMnemonic(mnemonic: string, compressed = true): Promise<IKeyPair> {
		return this.fromPrivateKey(Buffer.from(await utils.sha256(Buffer.from(mnemonic, "utf8"))), compressed);
	}

	public async fromPrivateKey(privateKey: Buffer, compressed = true): Promise<IKeyPair> {
		return {
			compressed,
			privateKey: privateKey.toString("hex"),
			publicKey: Buffer.from(getPublicKey(privateKey, compressed)).toString("hex"),
		};
	}

	public async fromWIF(wif: string, version: number): Promise<IKeyPair> {
		const decoded = WIF.decode(wif, version);

		return {
			compressed: decoded.compressed,
			privateKey: decoded.privateKey.toString("hex"),
			publicKey: Buffer.from(getPublicKey(decoded.privateKey, decoded.compressed)).toString("hex"),
		};
	}
}
