import { Container } from "@arkecosystem/container";
import {
	BINDINGS,
	IAddressFactory,
	IHashFactory,
	IKeyPair,
	IMultiSignatureAsset,
	IPublicKeyFactory,
} from "@arkecosystem/crypto-contracts";

import { PublicKeyError } from "@arkecosystem/crypto-errors";

@Container.injectable()
export class Address implements IAddressFactory {
	@Container.inject(BINDINGS.HashFactory)
	private readonly hashFactory: IHashFactory;

	@Container.inject(BINDINGS.Identity.PublicKeyFactory)
	private readonly publicKeyFactory: IPublicKeyFactory;

	public async fromMnemonic(mnemonic: string, options: { pubKeyHash: number }): Promise<string> {
		return this.fromPublicKey(await this.publicKeyFactory.fromMnemonic(mnemonic), options);
	}

	public async fromPublicKey(publicKey: string, options: { pubKeyHash: number }): Promise<string> {
		if (!this.publicKeyFactory.verify(publicKey)) {
			throw new PublicKeyError(publicKey);
		}

		const buffer: Buffer = await this.hashFactory.ripemd160(Buffer.from(publicKey, "hex"));
		const payload: Buffer = Buffer.alloc(21);

		payload.writeUInt8(options.pubKeyHash, 0);
		buffer.copy(payload, 1);

		return this.fromBuffer(payload);
	}

	public async fromWIF(wif: string, options: { pubKeyHash: number; wif: number }): Promise<string> {
		return this.fromPublicKey(await this.publicKeyFactory.fromWIF(wif, options), options);
	}

	public async fromMultiSignatureAsset(
		asset: IMultiSignatureAsset,
		options: { pubKeyHash: number },
	): Promise<string> {
		return this.fromPublicKey(await this.publicKeyFactory.fromMultiSignatureAsset(asset), options);
	}

	public async fromPrivateKey(privateKey: IKeyPair, options: { pubKeyHash: number }): Promise<string> {
		return this.fromPublicKey(privateKey.publicKey, options);
	}

	public async fromBuffer(buffer: Buffer): Promise<string> {
		return Base58.encodeCheck(buffer);
	}

	public async toBuffer(
		address: string,
		options: { pubKeyHash: number },
	): Promise<{ addressBuffer: Buffer; addressError?: string }> {
		const buffer: Buffer = Base58.decodeCheck(address);
		const result: { addressBuffer: Buffer; addressError?: string } = {
			addressBuffer: buffer,
		};

		if (buffer[0] !== options.pubKeyHash) {
			result.addressError = `Expected address network byte ${options.pubKeyHash}, but got ${buffer[0]}.`;
		}

		return result;
	}

	public async validate(address: string, options: { pubKeyHash: number }): Promise<boolean> {
		try {
			return Base58.decodeCheck(address)[0] === options.pubKeyHash;
		} catch {
			return false;
		}
	}
}
