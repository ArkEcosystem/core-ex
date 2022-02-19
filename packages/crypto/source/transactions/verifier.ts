import { Hash } from "../crypto/hash";
import { DuplicateParticipantInMultiSignatureError, InvalidMultiSignatureAssetError } from "../errors";
import { IMultiSignatureAsset, ISchemaValidationResult, ITransactionData, IVerifyOptions } from "../interfaces";
import { configManager } from "../managers";
import { validator } from "../validation";
import { TransactionTypeFactory } from "./types/factory";
import { Utils } from "./utils";

export class Verifier {
	public static verify(data: ITransactionData, options?: IVerifyOptions): boolean {
		if (configManager.getMilestone().aip11 && (!data.version || data.version === 1)) {
			return false;
		}

		return Verifier.verifyHash(data, options?.disableVersionCheck);
	}

	public static verifySignatures(transaction: ITransactionData, multiSignature: IMultiSignatureAsset): boolean {
		if (!multiSignature) {
			throw new InvalidMultiSignatureAssetError();
		}

		const { publicKeys, min }: IMultiSignatureAsset = multiSignature;
		const { signatures }: ITransactionData = transaction;

		const hash: Buffer = Utils.toHash(transaction, {
			excludeMultiSignature: true,
			excludeSignature: true,
		});

		const publicKeyIndexes: { [index: number]: boolean } = {};
		let verified = false;
		let verifiedSignatures = 0;

		if (signatures) {
			for (let i = 0; i < signatures.length; i++) {
				const signature: string = signatures[i];
				const publicKeyIndex: number = parseInt(signature.slice(0, 2), 16);

				if (!publicKeyIndexes[publicKeyIndex]) {
					publicKeyIndexes[publicKeyIndex] = true;
				} else {
					throw new DuplicateParticipantInMultiSignatureError();
				}

				const partialSignature: string = signature.slice(2, 130);
				const publicKey: string = publicKeys[publicKeyIndex];

				if (Hash.verifySchnorr(hash, partialSignature, publicKey)) {
					verifiedSignatures++;
				}

				if (verifiedSignatures === min) {
					verified = true;
					break;
				} else if (signatures.length - (i + 1 - verifiedSignatures) < min) {
					break;
				}
			}
		}

		return verified;
	}

	public static verifyHash(data: ITransactionData, disableVersionCheck = false): boolean {
		const { signature, senderPublicKey } = data;

		if (!signature || !senderPublicKey) {
			return false;
		}

		const hash: Buffer = Utils.toHash(data, {
			disableVersionCheck,
			excludeSignature: true,
		});

		return this.internalVerifySignature(hash, signature, senderPublicKey);
	}

	public static verifySchema(data: ITransactionData, strict = true): ISchemaValidationResult {
		const transactionType = TransactionTypeFactory.get(data.type, data.typeGroup, data.version);

		if (!transactionType) {
			throw new Error();
		}

		const { $id } = transactionType.getSchema();

		return validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
	}

	private static internalVerifySignature(hash: Buffer, signature: string, publicKey: string): boolean {
		const isSchnorr = Buffer.from(signature, "hex").byteLength === 64;
		if (isSchnorr) {
			return Hash.verifySchnorr(hash, signature, publicKey);
		}

		return Hash.verifyECDSA(hash, signature, publicKey);
	}
}
