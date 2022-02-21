import { Container } from "@arkecosystem/container";
import { BINDINGS } from "@arkecosystem/crypto-contracts";
import { Configuration } from "@arkecosystem/crypto-config";

import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions } from "../../../interfaces";

import { BigNumber, ByteBuffer } from "@arkecosystem/utils";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

@Container.injectable()
export abstract class DelegateResignationTransaction extends Transaction {
	@Container.inject(BINDINGS.Configuration)
	private readonly configuration: Configuration;

	public static typeGroup: number = TransactionTypeGroup.Core;
	public static type: number = TransactionType.DelegateResignation;
	public static key = "delegateResignation";
	public static version: number = 2;

	protected static defaultStaticFee: BigNumber = BigNumber.make("2500000000");

	public static getSchema(): schemas.TransactionSchema {
		return schemas.delegateResignation;
	}

	public verify(): boolean {
		return this.configuration.getMilestone().aip11 && super.verify();
	}

	public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
		return new ByteBuffer(Buffer.alloc(0));
	}

	public deserialize(buf: ByteBuffer): void {
		return;
	}
}
