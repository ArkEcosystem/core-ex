import { Application } from "@arkecosystem/core-kernel";
import memoize from "fast-memoize";

import {
	// registerBlockFactory,
	// registerIdentityFactory,
	// registerPeerFactory,
	// registerRoundFactory,
	// registerTransactionFactory,
	registerWalletFactory,
} from "./factories";
import { Factory } from "./factory";
import { FactoryBuilder } from "./factory-builder";

const createFactory = memoize((app: Application): FactoryBuilder => {
	const factory: FactoryBuilder = new FactoryBuilder();

	// registerBlockFactory(factory);

	// registerIdentityFactory(factory);

	// registerPeerFactory(factory);

	// registerRoundFactory(factory);

	// registerTransactionFactory(factory);

	registerWalletFactory(factory, app);

	return factory;
});

export const factory = (name: string, app: Application): Factory => createFactory(app).get(name);
