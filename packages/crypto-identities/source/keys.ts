import { Container } from "@arkecosystem/container";
import { BINDINGS, IHashFactory, IKeyPair, IKeyPairFactory } from "@arkecosystem/crypto-contracts";
import { NetworkVersionError } from "@arkecosystem/crypto-errors";
import { secp256k1 } from "bcrypto";
import WIF from "wif";

@Container.injectable()
export class Keys implements IKeyPairFactory {
	@Container.inject(BINDINGS.HashFactory)
	private readonly hashFactory: IHashFactory;

	public async fromMnemonic(mnemonic: string, compressed = true): Promise<IKeyPair> {
		return this.fromPrivateKey(await this.hashFactory.sha256(Buffer.from(mnemonic, "utf8")), compressed);
	}

	public async fromPrivateKey(privateKey: Buffer | string, compressed = true): Promise<IKeyPair> {
		privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");

		return {
			compressed,
			privateKey: privateKey.toString("hex"),
			publicKey: secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
		};
	}

	public async fromWIF(wif: string, options: { wif: number }): Promise<IKeyPair> {
		const { version, compressed, privateKey } = WIF.decode(wif, options.wif);

		if (version !== options.wif) {
			throw new NetworkVersionError(options.wif, version);
		}

		return {
			compressed,
			privateKey: privateKey.toString("hex"),
			publicKey: secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
		};
	}
}
