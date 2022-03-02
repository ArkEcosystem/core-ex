import { Crypto, Identifiers } from "@arkecosystem/core-contracts";
import { DelegateRegistrationBuilder } from "@arkecosystem/core-crypto-transaction-delegate-registration";
import { MultiPaymentBuilder } from "@arkecosystem/core-crypto-transaction-multi-payment";
import { MultiSignatureBuilder } from "@arkecosystem/core-crypto-transaction-multi-signature-registration";
import { TransferBuilder } from "@arkecosystem/core-crypto-transaction-transfer";
import { VoteBuilder } from "@arkecosystem/core-crypto-transaction-vote";
import { Container } from "@arkecosystem/core-kernel";
import { BigNumber } from "@arkecosystem/utils";

export class Signer {
	@Container.inject(Identifiers.Cryptography.Configuration)
	private readonly configuration: Crypto.IConfiguration;

	@Container.inject(Identifiers.Cryptography.Identity.PublicKeyFactory)
	private readonly publicKeyFactory: Crypto.IPublicKeyFactory;

	private nonce: BigNumber;

	public constructor(config, nonce: string) {
		this.configuration.setConfig(config);

		this.nonce = BigNumber.make(nonce || 0);
	}

	public async makeTransfer(options: Record<string, any>) {
		const transaction = new TransferBuilder()
			.fee(this.toSatoshi(options.transferFee))
			.nonce(this.nonce.toString())
			.recipientId(options.recipient)
			.amount(this.toSatoshi(options.amount));

		if (options.vendorField) {
			transaction.vendorField(options.vendorField);
		}

		await transaction.sign(options.passphrase);

		this.incrementNonce();
		return transaction.getStruct();
	}

	public async makeDelegate(options: Record<string, any>) {
		const transaction = await new DelegateRegistrationBuilder()
			.fee(this.toSatoshi(options.delegateFee))
			.nonce(this.nonce.toString())
			.usernameAsset(options.username)
			.sign(options.passphrase);

		this.incrementNonce();
		return transaction.getStruct();
	}

	public async makeVote(options: Record<string, any>) {
		const transaction = await new VoteBuilder()
			.fee(this.toSatoshi(options.voteFee))
			.nonce(this.nonce.toString())
			.votesAsset([`+${options.delegate}`])
			.sign(options.passphrase);

		this.incrementNonce();
		return transaction.getStruct();
	}

	public async makeMultiSignatureRegistration(options: Record<string, any>) {
		const transaction = new MultiSignatureBuilder()
			.multiSignatureAsset({
				min: options.min,
				publicKeys: options.participants.split(","),
			})
			.senderPublicKey(await this.publicKeyFactory.fromMnemonic(options.passphrase))
			.nonce(this.nonce.toString());

		for (const [index, passphrase] of options.passphrases.split(",").entries()) {
			await transaction.multiSign(passphrase, index);
		}

		await transaction.sign(options.passphrase);

		this.incrementNonce();
		return transaction.getStruct();
	}

	public async makeMultipayment(options: Record<string, any>) {
		const transaction = new MultiPaymentBuilder()
			.fee(this.toSatoshi(options.multipaymentFee))
			.nonce(this.nonce.toString());

		for (const payment of options.payments) {
			transaction.addPayment(payment.recipientId, payment.amount);
		}

		await transaction.sign(options.passphrase);

		this.incrementNonce();
		return transaction.getStruct();
	}

	private incrementNonce(): void {
		this.nonce = this.nonce.plus(1);
	}

	private toSatoshi(value): string {
		return BigNumber.make(value * 1e8).toFixed();
	}
}
