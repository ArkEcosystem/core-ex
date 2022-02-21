import { Container } from "@arkecosystem/container";
import { BINDINGS, IKeyPairFactory, IPublicKeyFactory, IMultiSignatureAsset } from "@arkecosystem/crypto-contracts";
import { InvalidMultiSignatureAssetError, PublicKeyError } from "@arkecosystem/crypto-errors";
import { secp256k1 } from "bcrypto";

import { numberToHex } from "./helpers";

@Container.injectable()
export class PublicKey implements IPublicKeyFactory {
	@Container.inject(BINDINGS.Identity.KeyPairFactory)
	private readonly keyPairFactory: IKeyPairFactory;

	@Container.inject(BINDINGS.Identity.PublicKeyFactory)
	private readonly publicKeyFactory: IPublicKeyFactory;

	public async fromMnemonic(mnemonic: string): Promise<string> {
		return (await this.keyPairFactory.fromMnemonic(mnemonic)).publicKey;
	}

	public async fromWIF(wif: string, options: { wif: number }): Promise<string> {
		return (await this.keyPairFactory.fromWIF(wif, options)).publicKey;
	}

	public async fromMultiSignatureAsset(asset: IMultiSignatureAsset): Promise<string> {
		const { min, publicKeys }: IMultiSignatureAsset = asset;

		for (const publicKey of publicKeys) {
			if (!this.verify(publicKey)) {
				throw new PublicKeyError(publicKey);
			}
		}

		if (min < 1 || min > publicKeys.length) {
			throw new InvalidMultiSignatureAssetError();
		}

		const minKey: string = await this.publicKeyFactory.fromMnemonic(numberToHex(min));
		const keys: string[] = [minKey, ...publicKeys];

		return secp256k1
			.publicKeyCombine(keys.map((publicKey: string) => Buffer.from(publicKey, "hex")))
			.toString("hex");
	}

	public async verify(publicKey: string): Promise<boolean> {
		return secp256k1.publicKeyVerify(Buffer.from(publicKey, "hex"));
	}
}
