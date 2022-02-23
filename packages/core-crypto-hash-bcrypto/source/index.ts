import { Container } from "@arkecosystem/core-container";
import { HashInput, IHashFactory as Contract } from "@arkecosystem/core-crypto-contracts";
import { Hash256, RIPEMD160, SHA256 } from "bcrypto";

@Container.injectable()
export class HashFactory implements Contract {
	public async ripemd160(data: HashInput): Promise<Buffer> {
		return RIPEMD160.digest(Array.isArray(data) ? Buffer.concat(data) : data);
	}

	public async sha256(data: HashInput): Promise<Buffer> {
		return SHA256.digest(Array.isArray(data) ? Buffer.concat(data) : data);
	}

	public async hash256(data: HashInput): Promise<Buffer> {
		return Hash256.digest(Array.isArray(data) ? Buffer.concat(data) : data);
	}
}