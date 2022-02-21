import { HashFactory } from "@arkecosystem/crypto-hash-bcrypto";
import { Container } from "@arkecosystem/container";
import {
	BINDINGS,
	IBlockData,
} from "@arkecosystem/crypto-contracts";
import { Serializer } from "./serializer";

@Container.injectable()
export class IdFactory {
	@Container.inject(BINDINGS.Block.Serializer)
	private readonly serializer: Serializer; // @TODO: create contract for block serializer

	public async make(data: IBlockData): Promise<string> {
		return (await new HashFactory().sha256(this.serializer.serialize(data))).toString("hex");
	}
}
