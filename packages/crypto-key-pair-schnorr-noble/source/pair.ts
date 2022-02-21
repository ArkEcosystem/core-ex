import { IKeyPair, IKeyPairFactory as Contract } from "@arkecosystem/crypto-contracts";
import { schnorr, utils } from "@noble/secp256k1";
import WIF from "wif";

export class KeyPairFactory implements Contract {
	public async fromMnemonic(mnemonic: string): Promise<IKeyPair> {
		return this.fromPrivateKey(Buffer.from(await utils.sha256(Buffer.from(mnemonic, "utf8"))));
	}

	public async fromPrivateKey(privateKey: Buffer): Promise<IKeyPair> {
		return {
			compressed: true,
			privateKey: privateKey.toString("hex"),
			publicKey: Buffer.from(schnorr.getPublicKey(privateKey)).toString("hex"),
		};
	}

	public async fromWIF(wif: string, version: number): Promise<IKeyPair> {
		const decoded = WIF.decode(wif, version);

		return {
			compressed: decoded.compressed,
			privateKey: decoded.privateKey.toString("hex"),
			publicKey: Buffer.from(schnorr.getPublicKey(decoded.privateKey)).toString("hex"),
		};
	}
}
