import { inject, injectable } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { BigNumber } from "@arkecosystem/utils";

@injectable()
export class BlockVerifier {
	@inject(Identifiers.Cryptography.Configuration)
	private readonly configuration: Contracts.Crypto.IConfiguration;

	@inject(Identifiers.Cryptography.Block.Serializer)
	private readonly serializer: Contracts.Crypto.IBlockSerializer;

	@inject(Identifiers.Cryptography.HashFactory)
	private readonly hashFactory: Contracts.Crypto.IHashFactory;

	@inject(Identifiers.Cryptography.Time.Slots)
	private readonly slots: Contracts.Crypto.Slots;

	@inject(Identifiers.Cryptography.Signature)
	private readonly signatureFactory: Contracts.Crypto.ISignature;

	@inject(Identifiers.Cryptography.Transaction.Verifier)
	private readonly transactionVerifier: Contracts.Crypto.ITransactionVerifier;

	public async verify(block: Contracts.Crypto.IBlockData): Promise<Contracts.Crypto.IBlockVerification> {
		const result: Contracts.Crypto.IBlockVerification = {
			containsMultiSignatures: false,
			errors: [],
			verified: false,
		};

		try {
			const constants = this.configuration.getMilestone(block.height);

			if (block.height !== 1 && !block.previousBlock) {
				result.errors.push("Invalid previous block");
			}

			if (!block.reward.isEqualTo(constants.reward)) {
				result.errors.push(["Invalid block reward:", block.reward, "expected:", constants.reward].join(" "));
			}

			const valid = this.verifySignature();

			if (!valid) {
				result.errors.push("Failed to verify block signature");
			}

			if (block.version !== constants.block.version) {
				result.errors.push("Invalid block version");
			}

			if (block.timestamp > this.slots.getTime() + this.configuration.getMilestone(block.height).blockTime) {
				result.errors.push("Invalid block timestamp");
			}

			const size: number = this.serializer.size(this);
			if (size > constants.block.maxPayload) {
				result.errors.push(`Payload is too large: ${size} > ${constants.block.maxPayload}`);
			}

			const invalidTransactions: Contracts.Crypto.ITransaction[] = [];

			for (const transaction of this.transactions) {
				if (!await this.transactionVerifier.verifyHash(transaction)) {
					invalidTransactions.push(transaction);
				}
			}

			if (invalidTransactions.length > 0) {
				result.errors.push("One or more transactions are not verified:");

				for (const invalidTransaction of invalidTransactions) {
					result.errors.push(`=> ${invalidTransaction.serialized.toString("hex")}`);
				}

				result.containsMultiSignatures = invalidTransactions.some((tx) => !!tx.data.signatures);
			}

			if (block.transactions.length !== block.numberOfTransactions) {
				result.errors.push("Invalid number of transactions");
			}

			if (block.transactions.length > constants.block.maxTransactions && block.height > 1) {
				result.errors.push("Transactions length is too high");
			}

			// Checking if transactions of the block adds up to block values.
			const appliedTransactions: Record<string, Contracts.Crypto.ITransactionData> = {};

			let totalAmount: BigNumber = BigNumber.ZERO;
			let totalFee: BigNumber = BigNumber.ZERO;

			const payloadBuffers: Buffer[] = [];
			for (const transaction of block.transactions) {
				if (!transaction || !transaction.id) {
					throw new Error();
				}

				const bytes: Buffer = Buffer.from(transaction.id, "hex");

				if (appliedTransactions[transaction.id]) {
					result.errors.push(`Encountered duplicate transaction: ${transaction.id}`);
				}

				if (
					transaction.expiration &&
					transaction.expiration > 0 &&
					transaction.expiration <= block.height
				) {
					result.errors.push(`Encountered expired transaction: ${transaction.id}`);
				}

				appliedTransactions[transaction.id] = transaction;

				totalAmount = totalAmount.plus(transaction.amount);
				totalFee = totalFee.plus(transaction.fee);

				payloadBuffers.push(bytes);
			}

			if (!totalAmount.isEqualTo(block.totalAmount)) {
				result.errors.push("Invalid total amount");
			}

			if (!totalFee.isEqualTo(block.totalFee)) {
				result.errors.push("Invalid total fee");
			}

			if ((await this.hashFactory.sha256(payloadBuffers)).toString("hex") !== block.payloadHash) {
				result.errors.push("Invalid payload hash");
			}
		} catch (error) {
			result.errors.push(error);
		}

		result.verified = result.errors.length === 0;

		return result;
	}

	public async verifySignature(block: Contracts.Crypto.IBlockData): Promise<boolean> {
		const bytes: Buffer = await this.serializer.serialize(block, false);
		const hash: Buffer = await this.hashFactory.sha256(bytes);

		if (!block.blockSignature) {
			throw new Error();
		}

		return this.signatureFactory.verify(
			hash,
			Buffer.from(block.blockSignature, "hex"),
			Buffer.from(block.generatorPublicKey, "hex"),
		);
	}
}
