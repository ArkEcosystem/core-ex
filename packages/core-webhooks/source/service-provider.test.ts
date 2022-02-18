import { Application, Container, Providers } from "@arkecosystem/core-kernel";
import { NullEventDispatcher } from "@arkecosystem/core-kernel/source/services/events/drivers/null";
import { describe } from "@arkecosystem/core-test-framework";
import { dirSync, setGracefulCleanup } from "tmp";

import {defaults} from "./defaults";
import { ServiceProvider } from "./service-provider";

let app: Application;

const logger = {
	debug: () => {},
	error: () => {},
	notice: () => {},
};

describe("ServiceProvider", ({beforeEach, afterAll, it, assert}) => {
	let serviceProvider: ServiceProvider;
	let pluginConfiguration: Providers.PluginConfiguration;

	beforeEach(() => {
		app = new Application(new Container.Container());

		app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
		app.bind(Container.Identifiers.StateStore).toConstantValue({});
		app.bind(Container.Identifiers.BlockchainService).toConstantValue({});
		app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue({});
		app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});
		app.bind(Container.Identifiers.WalletRepository).toConstantValue({});
		app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue({});
		app.bind(Container.Identifiers.PeerRepository).toConstantValue({});
		app.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue({});
		app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue({});
		app.bind(Container.Identifiers.TransactionPoolProcessorFactory).toConstantValue({});
		app.bind(Container.Identifiers.TransactionPoolProcessor).toConstantValue({});
		app.bind(Container.Identifiers.BlockHistoryService).toConstantValue({});
		app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue({});
		app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue({});
		app.bind(Container.Identifiers.StandardCriteriaService).toConstantValue({});
		app.bind(Container.Identifiers.PaginationService).toConstantValue({});
		app.bind(Container.Identifiers.EventDispatcherService).to(NullEventDispatcher);
		app.bind(Container.Identifiers.LogService).toConstantValue(logger);
		app.bind("path.cache").toConstantValue(dirSync().name);

		serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
		pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
		const instance = pluginConfiguration.from("core-webhooks", defaults);
		serviceProvider.setConfig(instance);
	})

	afterAll(() => setGracefulCleanup());


	it("should register", async () => {
		await assert.resolves(() => serviceProvider.register());
	});

	it("should boot and dispose", async () => {
		await assert.resolves(() => serviceProvider.register());
		await assert.resolves(() => serviceProvider.boot());
		await assert.resolves(() => serviceProvider.dispose());
	});

	it("should bootWhen be true when enabled", async () => {
		defaults.enabled = true;
		const instance = pluginConfiguration.from("core-webhooks", defaults);
		serviceProvider.setConfig(instance);

		assert.true(await serviceProvider.bootWhen());
	});

	it("should not be required", async () => {
		assert.false(await serviceProvider.required());
	});
})
