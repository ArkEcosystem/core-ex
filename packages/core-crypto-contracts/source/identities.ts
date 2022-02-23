import { IMultiSignatureAsset } from "./transactions";

export interface IKeyPair {
	publicKey: string;
	privateKey: string;
	compressed: boolean;
}

export interface AddressFactory {
	fromMnemonic(mnemonic: string): Promise<string>;

	fromPublicKey(publicKey: Buffer): Promise<string>;

	// fromWIF(wif: string, network?: Network): string;

	// fromMultiSignatureAsset(asset: IMultiSignatureAsset): string;

	// fromPrivateKey(privateKey: IKeyPair): string;

	validate(address: string): Promise<boolean>;
}

export interface IAddressFactory {
	fromMnemonic(mnemonic: string, pubKeyHash: number): Promise<string>;

	fromPublicKey(publicKey: string, pubKeyHash: number): Promise<string>;

	fromWIF(wif: string, options: { pubKeyHash: number; wif: number }): Promise<string>;

	fromMultiSignatureAsset(asset: IMultiSignatureAsset, pubKeyHash: number): Promise<string>;

	fromPrivateKey(privateKey: IKeyPair, pubKeyHash: number): Promise<string>;

	fromBuffer(buffer: Buffer): Promise<string>;

	toBuffer(address: string, pubKeyHash: number): Promise<{ addressBuffer: Buffer; addressError?: string }>;

	validate(address: string, pubKeyHash: number): Promise<boolean>;
}

export interface IPublicKeyFactory {
	fromMnemonic(mnemonic: string): Promise<string>;

	fromWIF(wif: string, version: number): Promise<string>;

	fromMultiSignatureAsset(asset: IMultiSignatureAsset): Promise<string>;

	verify(publicKey: string): Promise<boolean>;
}

export interface IPrivateKeyFactory {
	fromMnemonic(mnemonic: string): Promise<string>;

	fromWIF(wif: string, version: number): Promise<string>;
}

export interface IKeyPairFactory {
	fromMnemonic(mnemonic: string): Promise<IKeyPair>;

	fromPrivateKey(privateKey: Buffer): Promise<IKeyPair>;

	fromWIF(wif: string, version: number): Promise<IKeyPair>;
}

export interface IWIFFactory {
	fromMnemonic(mnemonic: string, version: number): Promise<string>;

	fromKeys(keys: IKeyPair, version: number): Promise<string>;
}