import { Signatory as Contract } from "@arkecosystem/crypto-contracts";
import { init, PublicKey, SecretKey, Signature } from "@chainsafe/bls/node";

export class Signatory implements Contract {
	public async init(): Promise<void> {
		try {
			await init("blst-native");
		} catch {
			await init("herumi");
		}
	}

	public sign(hash: Buffer, privateKey: Buffer): string {
		return SecretKey.fromHex(privateKey.toString("hex")).sign(hash).toHex();
	}

	public verify(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
		return Signature.fromHex(signature.toString("hex")).verify(PublicKey.fromHex(publicKey.toString("hex")), hash);
	}
}
