import { Container } from "@arkecosystem/core-kernel";
import { BigNumber } from "@arkecosystem/utils";

@Container.injectable()
export class FeeRegistry {
	readonly #registry: Record<number, Record<number, BigNumber>> = {};

	public get(type: number, version: number): BigNumber {
		return this.#registry[type][version];
	}

	public set(type: number, version: number, fee: BigNumber): void {
		if (this.#registry[type] === undefined) {
			this.#registry[type] = {};
		}

		this.#registry[type][version] = fee;
	}
}
