import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { schemas, Transaction } from "@arkecosystem/core-crypto-transaction";
import { ByteBuffer } from "@arkecosystem/utils";

@injectable()
export class MultiSignatureRegistrationTransaction extends Transaction {
	@inject(Identifiers.Cryptography.Identity.PublicKeySerializer)
	private readonly publicKeySerializer: Contracts.Crypto.IPublicKeySerializer;

	public static typeGroup: number = Contracts.Crypto.TransactionTypeGroup.Core;
	public static type: number = Contracts.Crypto.TransactionType.MultiSignature;
	public static key = "multiSignature";

	public static getSchema(): schemas.TransactionSchema {
		return schemas.extend(schemas.transactionBaseSchema, {
			$id: "multiSignature",
			properties: {
				amount: { bignumber: { maximum: 0, minimum: 0 } },
				asset: {
					properties: {
						multiSignature: {
							properties: {
								min: {
									maximum: { $data: "1/publicKeys/length" },
									minimum: 1,
									type: "integer",
								},
								publicKeys: {
									additionalItems: false,
									items: { $ref: "publicKey" },
									maxItems: 16,
									minItems: 1,
									type: "array",
									uniqueItems: true,
								},
							},
							required: ["min", "publicKeys"],
							type: "object",
						},
					},
					required: ["multiSignature"],
					type: "object",
				},
				fee: { bignumber: { minimum: 1 } },
				signatures: {
					additionalItems: false,
					items: { allOf: [{ maxLength: 130, minLength: 130 }, { $ref: "alphanumeric" }] },
					maxItems: { $data: "1/asset/multiSignature/publicKeys/length" },
					minItems: { $data: "1/asset/multiSignature/min" },
					type: "array",
					uniqueItems: true,
				},
				type: { transactionType: Contracts.Crypto.TransactionType.MultiSignature },
			},
			required: ["asset", "signatures"],
		});
	}

	// public static staticFee(
	// 	configuration: Contracts.Crypto.IConfiguration,
	// 	feeContext: { height?: number; data?: Contracts.Crypto.ITransactionData } = {},
	// ): BigNumber {
	// 	if (feeContext.data?.asset?.multiSignature) {
	// 		return super
	// 			.staticFee(configuration, feeContext)
	// 			.times(feeContext.data.asset.multiSignature.publicKeys.length + 1);
	// 	}

	// 	return super.staticFee(configuration, feeContext);
	// }

	public async serialize(options?: Contracts.Crypto.ISerializeOptions): Promise<ByteBuffer | undefined> {
		const { data } = this;
		const { min, publicKeys } = data.asset.multiSignature;
		// @TODO
		const buff: ByteBuffer = ByteBuffer.fromSize(2 + publicKeys.length * 32);

		buff.writeUint8(min);
		buff.writeUint8(publicKeys.length);

		for (const publicKey of publicKeys) {
			buff.writeBytes(Buffer.from(publicKey, "hex"));
		}

		return buff;
	}

	public async deserialize(buf: ByteBuffer): Promise<void> {
		const { data } = this;

		const multiSignature: Contracts.Crypto.IMultiSignatureAsset = { min: 0, publicKeys: [] };
		multiSignature.min = buf.readUint8();

		const count = buf.readUint8();
		for (let index = 0; index < count; index++) {
			const publicKey = this.publicKeySerializer.deserialize(buf).toString("hex");
			multiSignature.publicKeys.push(publicKey);
		}

		data.asset = { multiSignature };
	}
}
