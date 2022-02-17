import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Identities, Interfaces, Managers, Transactions, Types, Utils } from "@arkecosystem/crypto";

import secrets from "../internal/passphrases.json";
import { getWalletNonce } from "./generic";

const defaultPassphrase: string = secrets[0];

interface IPassphrasePair {
	passphrase: string;
}

// todo: replace this by the use of real factories
export class TransactionFactory {
	protected builder: any;
	protected app: Contracts.Kernel.Application;

	private network: Types.NetworkName = "testnet";
	private networkConfig: Interfaces.NetworkConfig | undefined;
	private nonce: Utils.BigNumber | undefined;
	private fee: Utils.BigNumber | undefined;
	private timestamp: number | undefined;
	private passphrase: string = defaultPassphrase;
	private passphraseList: string[] | undefined;
	private passphrasePairs: IPassphrasePair[] | undefined;
	private version: number | undefined;
	private senderPublicKey: string | undefined;
	private expiration: number | undefined;
	private vendorField: string | undefined;

	protected constructor(app?: Contracts.Kernel.Application) {
		// @ts-ignore - this is only needed because of the "getNonce"
		// method so we don't care if it is undefined in certain scenarios
		this.app = app;
	}

	public static initialize(app?: Contracts.Kernel.Application): TransactionFactory {
		return new TransactionFactory(app);
	}

	public transfer(recipientId?: string, amount: number = 2 * 1e8, vendorField?: string): TransactionFactory {
		const builder = Transactions.BuilderFactory.transfer()
			.amount(Utils.BigNumber.make(amount).toFixed(0))
			.recipientId(recipientId || Identities.Address.fromPassphrase(defaultPassphrase));

		if (vendorField) {
			builder.vendorField(vendorField);
		}

		this.builder = builder;

		return this;
	}

	public delegateRegistration(username?: string): TransactionFactory {
		const builder = Transactions.BuilderFactory.delegateRegistration();

		if (username) {
			builder.usernameAsset(username);
		}

		this.builder = builder;

		return this;
	}

	public delegateResignation(): TransactionFactory {
		this.builder = Transactions.BuilderFactory.delegateResignation();

		return this;
	}

	public vote(publicKey?: string): TransactionFactory {
		this.builder = Transactions.BuilderFactory.vote().votesAsset([
			`+${publicKey || Identities.PublicKey.fromPassphrase(defaultPassphrase)}`,
		]);

		return this;
	}

	public unvote(publicKey?: string): TransactionFactory {
		this.builder = Transactions.BuilderFactory.vote().votesAsset([
			`-${publicKey || Identities.PublicKey.fromPassphrase(defaultPassphrase)}`,
		]);

		return this;
	}

	public multiSignature(participants?: string[], min?: number): TransactionFactory {
		let passphrases: string[] | undefined;
		if (!participants) {
			passphrases = [secrets[0], secrets[1], secrets[2]];
		}

		participants = participants || [
			Identities.PublicKey.fromPassphrase(secrets[0]),
			Identities.PublicKey.fromPassphrase(secrets[1]),
			Identities.PublicKey.fromPassphrase(secrets[2]),
		];

		this.builder = Transactions.BuilderFactory.multiSignature().multiSignatureAsset({
			min: min || participants.length,
			publicKeys: participants,
		});

		if (passphrases) {
			this.withPassphraseList(passphrases);
		}

		this.withSenderPublicKey(participants[0]);

		return this;
	}

	public multiPayment(payments: Array<{ recipientId: string; amount: string }>): TransactionFactory {
		const builder = Transactions.BuilderFactory.multiPayment();

		for (const payment of payments) {
			builder.addPayment(payment.recipientId, payment.amount);
		}

		this.builder = builder;

		return this;
	}

	public withFee(fee: number): TransactionFactory {
		this.fee = Utils.BigNumber.make(fee);

		return this;
	}

	public withTimestamp(timestamp: number): TransactionFactory {
		this.timestamp = timestamp;

		return this;
	}

	public withNetwork(network: Types.NetworkName): TransactionFactory {
		this.network = network;

		return this;
	}

	public withNetworkConfig(networkConfig: Interfaces.NetworkConfig): TransactionFactory {
		this.networkConfig = networkConfig;

		return this;
	}

	public withHeight(height: number): TransactionFactory {
		Managers.configManager.setHeight(height);

		return this;
	}

	public withSenderPublicKey(sender: string): TransactionFactory {
		this.senderPublicKey = sender;

		return this;
	}

	public withNonce(nonce: Utils.BigNumber): TransactionFactory {
		this.nonce = nonce;

		return this;
	}

	public withExpiration(expiration: number): TransactionFactory {
		this.expiration = expiration;

		return this;
	}

	public withVersion(version: number): TransactionFactory {
		this.version = version;

		return this;
	}

	public withVendorField(vendorField: string): TransactionFactory {
		this.vendorField = vendorField;

		return this;
	}

	public withPassphrase(passphrase: string): TransactionFactory {
		this.passphrase = passphrase;

		return this;
	}

	public withPassphraseList(passphrases: string[]): TransactionFactory {
		this.passphraseList = passphrases;

		return this;
	}

	public withPassphrasePair(passphrases: IPassphrasePair): TransactionFactory {
		this.passphrase = passphrases.passphrase;

		return this;
	}

	public withPassphrasePairs(passphrases: IPassphrasePair[]): TransactionFactory {
		this.passphrasePairs = passphrases;

		return this;
	}

	public create(quantity = 1): Interfaces.ITransactionData[] {
		return this.make<Interfaces.ITransactionData>(quantity, "getStruct");
	}

	public createOne(): Interfaces.ITransactionData {
		return this.create(1)[0];
	}

	public build(quantity = 1): Interfaces.ITransaction[] {
		return this.make<Interfaces.ITransaction>(quantity, "build");
	}

	public getNonce(): Utils.BigNumber {
		if (this.nonce) {
			return this.nonce;
		}

		AppUtils.assert.defined<string>(this.senderPublicKey);

		return getWalletNonce(this.app, this.senderPublicKey);
	}

	/* istanbul ignore next */
	private make<T>(quantity = 1, method: string): T[] {
		if (this.passphrasePairs && this.passphrasePairs.length) {
			return this.passphrasePairs.map(
				(passphrasePair: IPassphrasePair) =>
					this.withPassphrase(passphrasePair.passphrase).sign<T>(quantity, method)[0],
			);
		}

		return this.sign<T>(quantity, method);
	}

	private sign<T>(quantity: number, method: string): T[] {
		if (this.networkConfig !== undefined) {
			Managers.configManager.setConfig(this.networkConfig);
		} else {
			Managers.configManager.setFromPreset(this.network);
		}

		// // ensure we use aip11
		// Managers.configManager.getMilestone().aip11 = true;
		// this.builder.data.version = 2;

		if (!this.senderPublicKey) {
			this.senderPublicKey = Identities.PublicKey.fromPassphrase(this.passphrase);
		}

		const transactions: T[] = [];
		let nonce = this.getNonce();

		for (let i = 0; i < quantity; i++) {
			if (this.builder.constructor.name === "TransferBuilder") {
				// @FIXME: when we use any of the "withPassphrase*" methods the builder will
				// always remember the previous vendor field instead generating a new one on each iteration
				const vendorField: string = this.builder.data.vendorField;

				if (!vendorField || (vendorField && vendorField.startsWith("Test Transaction"))) {
					this.builder.vendorField(`Test Transaction ${i + 1}`);
				}
			}

			if (
				this.builder.constructor.name === "DelegateRegistrationBuilder" && // @FIXME: when we use any of the "withPassphrase*" methods the builder will
				// always remember the previous username instead generating a new one on each iteration
				!this.builder.data.asset.delegate.username
			) {
				this.builder = Transactions.BuilderFactory.delegateRegistration().usernameAsset(
					this.getRandomUsername(),
				);
			}

			if (this.version) {
				this.builder.version(this.version);
			}

			if (this.builder.data.version > 1) {
				nonce = nonce.plus(1);
				this.builder.nonce(nonce);
			}

			if (this.fee) {
				this.builder.fee(this.fee.toFixed(0));
			}

			if (this.timestamp) {
				this.builder.data.timestamp = this.timestamp;
			}

			if (this.expiration) {
				this.builder.expiration(this.expiration);
			}

			if (this.vendorField) {
				this.builder.vendorField(this.vendorField);
			}

			this.builder.senderPublicKey(this.senderPublicKey);

			const isDevelop = !["mainnet", "devnet"].includes(Managers.configManager.get("network.name"));

			const aip11: boolean = Managers.configManager.getMilestone().aip11;

			if (this.builder.data.version === 1 && aip11) {
				Managers.configManager.getMilestone().aip11 = false;
			} /* istanbul ignore else */ else if (isDevelop) {
				Managers.configManager.getMilestone().aip11 = true;
			}

			let sign = true;

			if (this.passphraseList && this.passphraseList.length) {
				for (let i = 0; i < this.passphraseList.length; i++) {
					this.builder.multiSign(this.passphraseList[i], i);
				}

				sign = this.builder.constructor.name === "MultiSignatureBuilder";
			}

			if (sign) {
				this.builder.sign(this.passphrase);
			}

			const transaction = this.builder[method]();

			/* istanbul ignore else */
			if (isDevelop) {
				Managers.configManager.getMilestone().aip11 = true;
			}

			transactions.push(transaction);
		}

		return transactions;
	}

	private getRandomUsername(): string {
		return Math.random().toString(36).toLowerCase();
	}
}
