import { Kernel } from "@arkecosystem/core-contracts";

import { injectable } from "../../ioc";
import { ClassManager } from "../../support/class-manager";
import { MemoryCacheStore } from "./drivers/memory";

@injectable()
export class CacheManager extends ClassManager {
	protected async createMemoryDriver<K, T>(): Promise<Kernel.CacheStore<K, T>> {
		return this.app.resolve<Kernel.CacheStore<K, T>>(MemoryCacheStore).make();
	}

	protected getDefaultDriver(): string {
		return "memory";
	}
}
