import { schnorr } from "bcrypto";

export class Hash {
    public static sign(hash: Buffer, privateKey: Buffer): string {
        return schnorr.sign(hash, privateKey).toString("hex");
    }

    public static verify(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        return schnorr.verify(
            hash,
            signature instanceof Buffer ? signature : Buffer.from(signature, "hex"),
            publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
        );
    }
}
