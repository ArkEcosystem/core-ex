import { Signatory as Contract } from "@arkecosystem/crypto-contracts";
import { schnorr } from "bcrypto";

export class Signatory implements Contract {
	public async sign(hash: Buffer, privateKey: Buffer): Promise<string> {
		return schnorr.sign(hash, privateKey).toString("hex");
	}

	public async verify(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): Promise<boolean> {
		return schnorr.verify(
			hash,
			signature instanceof Buffer ? signature : Buffer.from(signature, "hex"),
			publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
		);
	}
}
