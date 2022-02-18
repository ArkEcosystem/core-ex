import { IHashFactory as Contract } from "@arkecosystem/crypto-contracts";
import { ripemd160, sha256, createSHA256, createHMAC } from 'hash-wasm';

export class HashFactory implements Contract {
	public async ripemd160(data: Buffer): Promise<Buffer> {
		return Buffer.from(await ripemd160(data), "hex");
	}

	public async sha256(data: Buffer): Promise<Buffer> {
		return Buffer.from(await sha256(data), "hex");
	}

	public async hash256(data: Buffer): Promise<Buffer> {
		const hmac = await createHMAC(createSHA256(), 'key');
		hmac.init();
		hmac.update(data);

		return Buffer.from(hmac.digest(), "hex");
	}
}
