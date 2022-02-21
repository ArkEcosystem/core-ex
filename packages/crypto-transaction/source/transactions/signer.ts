import { Container } from "@arkecosystem/container";
import { BINDINGS } from "@arkecosystem/crypto-contracts";

import { Hash } from "../crypto";
import { IKeyPair, ISerializeOptions, ITransactionData } from "@arkecosystem/crypto-contracts";
import { numberToHex } from "../utils";
import { Utils } from "./utils";

@Container.injectable()
export class Signer {
	@Container.inject(BINDINGS.Transaction.Utils)
	private readonly utils: Utils;

	public async sign(transaction: ITransactionData, keys: IKeyPair, options?: ISerializeOptions): Promise<string> {
		if (!options || options.excludeSignature === undefined) {
			options = { excludeSignature: true, ...options };
		}

		const hash: Buffer = await this.utils.toHash(transaction, options);
		const signature: string =
			transaction.version && transaction.version > 1 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

		if (!transaction.signature && !options.excludeMultiSignature) {
			transaction.signature = signature;
		}

		return signature;
	}

	public async multiSign(transaction: ITransactionData, keys: IKeyPair, index = -1): Promise<string> {
		if (!transaction.signatures) {
			transaction.signatures = [];
		}

		index = index === -1 ? transaction.signatures.length : index;

		const hash: Buffer = await this.utils.toHash(transaction, {
			excludeMultiSignature: true,
			excludeSignature: true,
		});

		const signature: string = Hash.signSchnorr(hash, keys);
		const indexedSignature = `${numberToHex(index)}${signature}`;
		transaction.signatures.push(indexedSignature);

		return indexedSignature;
	}
}
