import { Container } from "@arkecosystem/container";
import {
	BINDINGS,
	BlockFactoryInstance,
	IBlock,
	IBlockData,
	IBlockJson,
	IHashFactory,
	IKeyPair,
	ITransaction,
	Signatory,
} from "@arkecosystem/crypto-contracts";
import { BigNumber } from "@arkecosystem/utils";
import { Block } from "./block";
import { Deserializer } from "./deserializer";
import { Serializer } from "./serializer";
import { Configuration } from "@arkecosystem/crypto-config";
import { applySchema } from "./utils";
import { IdFactory } from "./id.factory";

@Container.injectable()
export class BlockFactory {
	@Container.inject(BINDINGS.Configuration)
	private readonly configuration: Configuration;

	@Container.inject(BINDINGS.Block.Serializer)
	private readonly serializer: Serializer; // @TODO: create contract for block serializer

	@Container.inject(BINDINGS.Block.Deserializer)
	private readonly deserializer: Deserializer; // @TODO: create contract for block deserializer

	@Container.inject(BINDINGS.Block.FactoryInstance)
	private readonly blockFactory: BlockFactoryInstance; // @TODO: create contract for block deserializer

	@Container.inject(BINDINGS.Block.IdFactory)
	private readonly idFactory: IdFactory;

	@Container.inject(BINDINGS.HashFactory)
	private readonly hashFactory: IHashFactory;

	@Container.inject(BINDINGS.SignatureFactory)
	private readonly signatureFactory: Signatory;

	// @todo: add a proper type hint for data
	public async make(data: any, keys: IKeyPair): Promise<IBlock | undefined> {
		data.generatorPublicKey = keys.publicKey;

		const payloadHash: Buffer = this.serializer.serialize(data, false);
		const hash: Buffer = await this.hashFactory.sha256(payloadHash);

		data.blockSignature = await this.signatureFactory.sign(hash, Buffer.from(keys.privateKey, "hex"));

		data.id = await this.idFactory.make(data);

		return this.fromData(data);
	}

	public async fromHex(hex: string): Promise<IBlock> {
		return this.fromSerialized(Buffer.from(hex, "hex"));
	}

	public async fromBytes(buff: Buffer): Promise<IBlock> {
		return this.fromSerialized(buff);
	}

	public async fromJson(json: IBlockJson): Promise<IBlock | undefined> {
		// @ts-ignore
		const data: IBlockData = { ...json };
		data.totalAmount = BigNumber.make(data.totalAmount);
		data.totalFee = BigNumber.make(data.totalFee);
		data.reward = BigNumber.make(data.reward);

		if (data.transactions) {
			for (const transaction of data.transactions) {
				transaction.amount = BigNumber.make(transaction.amount);
				transaction.fee = BigNumber.make(transaction.fee);
			}
		}

		return this.fromData(data);
	}

	public async fromData(
		data: IBlockData,
		options: { deserializeTransactionsUnchecked?: boolean } = {},
	): Promise<IBlock | undefined> {
		if (await applySchema(data)) {
			const serialized: Buffer = this.serializer.serializeWithTransactions(data);
			const block: IBlock = this.blockFactory({
				...(await this.deserializer.deserialize(serialized, false, options)),
				id: data.id,
			});
			block.serialized = serialized.toString("hex");

			return block;
		}

		return undefined;
	}

	private async fromSerialized(serialized: Buffer): Promise<IBlock> {
		const deserialized: { data: IBlockData; transactions: ITransaction[] } = await this.deserializer.deserialize(
			serialized,
		);

		const validated: IBlockData | undefined = await applySchema(deserialized.data);

		if (validated) {
			deserialized.data = validated;
		}

		const block: IBlock = new Block(this.configuration, deserialized);
		block.serialized = serialized.toString("hex");

		return block;
	}
}
