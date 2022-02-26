import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Crypto, Identities, Managers } from "@arkecosystem/crypto";
import Interfaces from "@arkecosystem/core-crypto-contracts";
import forge from "node-forge";
import wif from "wif";

import { Delegate } from "../interfaces";
import { Method } from "./method";

export class BIP38 extends Method implements Delegate {
	public keys: Interfaces.IKeyPair | undefined;

	public publicKey: string;

	public address: string;

	public otpSecret: string;

	public otp: string | undefined;

	public encryptedKeys: string | undefined;

	private readonly keySize: number = 32;

	private readonly iterations: number = 5000;

	public constructor(bip38: string, password: string) {
		super();

		this.keys = this.decryptPassphrase(bip38, password);
		this.publicKey = this.keys.publicKey;
		this.address = Identities.Address.fromPublicKey(this.keys.publicKey);
		this.otpSecret = forge.random.getBytesSync(128);

		this.encryptKeysWithOtp();
	}

	public forge(transactions: Interfaces.ITransactionData[], options: Record<string, any>): Interfaces.IBlock {
		this.decryptKeysWithOtp();

		AppUtils.assert.defined<Interfaces.IKeyPair>(this.keys);

		const block: Interfaces.IBlock = this.createBlock(this.keys, transactions, options);

		this.encryptKeysWithOtp();

		return block;
	}

	private encryptKeysWithOtp(): void {
		AppUtils.assert.defined<Interfaces.IKeyPair>(this.keys);

		const wifKey: string = Identities.WIF.fromKeys(this.keys);

		this.keys = undefined;
		this.otp = forge.random.getBytesSync(16);
		this.encryptedKeys = this.encryptDataWithOtp(wifKey, this.otp);
	}

	private decryptKeysWithOtp(): void {
		AppUtils.assert.defined<string>(this.encryptedKeys);
		AppUtils.assert.defined<string>(this.otp);

		const wifKey: string = this.decryptDataWithOtp(this.encryptedKeys, this.otp);

		this.keys = Identities.Keys.fromWIF(wifKey);
		this.otp = undefined;
		this.encryptedKeys = undefined;
	}

	private decryptPassphrase(passphrase: string, password: string): Interfaces.IKeyPair {
		const decryptedWif: Interfaces.IDecryptResult = Crypto.bip38.decrypt(passphrase, password);
		const wifKey: string = wif.encode(
			Managers.configManager.get("network.wif"),
			decryptedWif.privateKey,
			decryptedWif.compressed,
		);

		return Identities.Keys.fromWIF(wifKey);
	}

	private encryptDataWithOtp(content: string, password: string): string {
		AppUtils.assert.defined<string>(this.otpSecret);

		const cipher: forge.cipher.BlockCipher = forge.cipher.createCipher(
			"AES-CBC",
			forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize),
		);
		cipher.start({ iv: this.otp });
		cipher.update(forge.util.createBuffer(content));
		cipher.finish();

		return forge.util.encode64(cipher.output.getBytes());
	}

	private decryptDataWithOtp(cipherText: string, password: string): string {
		AppUtils.assert.defined<string>(this.otpSecret);

		const decipher: forge.cipher.BlockCipher = forge.cipher.createDecipher(
			"AES-CBC",
			forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize),
		);
		decipher.start({ iv: this.otp });
		decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText)));
		decipher.finish();

		return decipher.output.toString();
	}
}
