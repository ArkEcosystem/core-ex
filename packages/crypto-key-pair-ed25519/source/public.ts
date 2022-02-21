import { IPublicKeyFactory, IMultiSignatureAsset } from "@arkecosystem/crypto-contracts";
import { KeyPairFactory } from "./pair";

export class PublicKeyFactory implements IPublicKeyFactory {
	readonly #keyPairFactory: KeyPairFactory;

	public constructor() {
		this.#keyPairFactory = new KeyPairFactory();
	}

	public async fromMnemonic(mnemonic: string): Promise<string> {
		return (await this.#keyPairFactory.fromMnemonic(mnemonic)).publicKey;
	}

	public async fromWIF(wif: string, version: number): Promise<string> {
		return (await this.#keyPairFactory.fromWIF(wif, version)).publicKey;
	}

	public async fromMultiSignatureAsset(asset: IMultiSignatureAsset): Promise<string> {
		throw new Error("Not Implemented");
	}

	public async verify(publicKey: string): Promise<boolean> {
		throw new Error("Not Implemented");
	}
}
