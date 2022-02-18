import { IHashFactory as Contract } from "@arkecosystem/crypto-contracts";
import { ripemd160 } from '@noble/hashes/ripemd160';
import { sha256 } from '@noble/hashes/sha256';

export class HashFactory implements Contract {
	public async ripemd160(data: Buffer): Promise<Buffer> {
		return Buffer.from(ripemd160(data));
	}

	public async sha256(data: Buffer): Promise<Buffer> {
		return Buffer.from(sha256(data));
	}

	public async hash256(data: Buffer): Promise<Buffer> {
		return Buffer.from(sha256(Buffer.from(sha256(data))));
	}
}
