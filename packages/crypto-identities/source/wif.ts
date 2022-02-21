import { Container } from "@arkecosystem/container";
import { BINDINGS, IKeyPair, IKeyPairFactory, IWIFFactory } from "@arkecosystem/crypto-contracts";
import wif from "wif";

@Container.injectable()
export class WIF implements IWIFFactory {
	@Container.inject(BINDINGS.Identity.KeyPairFactory)
	private readonly keyPairFactory: IKeyPairFactory;

	public async fromMnemonic(mnemonic: string, options: { wif: number }): Promise<string> {
		const { compressed, privateKey }: IKeyPair = await this.keyPairFactory.fromMnemonic(mnemonic);

		return wif.encode(options.wif, Buffer.from(privateKey, "hex"), compressed);
	}

	public async fromKeys(keys: IKeyPair, options: { wif: number }): Promise<string> {
		return wif.encode(options.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
	}
}
