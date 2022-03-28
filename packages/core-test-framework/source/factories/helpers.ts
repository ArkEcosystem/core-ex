import { Application } from "@arkecosystem/core-kernel";
import memoize from "fast-memoize";

import {
	registerBlockFactory,
	registerIdentityFactory,
	registerPeerFactory,
	registerRoundFactory,
	registerTransactionFactory,
	registerWalletFactory,
} from "./factories";
import { Factory } from "./factory";
import { FactoryBuilder } from "./factory-builder";

const createFactory = memoize((app: Application): FactoryBuilder => {
	const factory: FactoryBuilder = new FactoryBuilder();

	registerBlockFactory(factory, app);

	registerIdentityFactory(factory, app);

	registerPeerFactory(factory);

	registerRoundFactory(factory, app);

	registerTransactionFactory(factory, app);

	registerWalletFactory(factory, app);

	return factory;
});

export const factory = (name: string, app: Application): Factory => createFactory(app).get(name);
