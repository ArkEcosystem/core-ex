import { Interfaces, Managers } from "@arkecosystem/crypto";

import { describe } from "../../../../core-test-framework";
import { Application } from "../../application";
import { Container, Identifiers } from "../../ioc";
import { ConfigRepository } from "../../services/config";
import { LoadCryptography } from "./load-cryptography";

describe<{
	app: Application;
	config: Interfaces.NetworkConfig;
	configRepository: ConfigRepository;
}>("LoadCryptography", ({ afterEach, assert, beforeEach, it }) => {
	beforeEach((context) => {
		context.app = new Application(new Container());
		context.config = Managers.configManager.all();
		context.configRepository = context.app.get<ConfigRepository>(Identifiers.ConfigRepository);
	});

	afterEach((context) => {
		Managers.configManager.setConfig(context.config);
	});

	it("should bootstrap from the network name", async (context) => {
		// Doesn't really matter network we use here as we don't rely on any specific values
		context.app.bind(Identifiers.ApplicationNetwork).toConstantValue("testnet");

		await context.app.resolve<LoadCryptography>(LoadCryptography).bootstrap();

		assert.containKeys(context.app.get(Identifiers.Crypto), [
			"network",
			"exceptions",
			"milestones",
			"genesisBlock",
		]);
	});

	it("should bootstrap from the configuration repository", async (context) => {
		context.configRepository.merge({
			crypto: {
				exceptions: {},
				genesisBlock: {},
				milestones: [],
				network: {},
			},
		});

		await context.app.resolve<LoadCryptography>(LoadCryptography).bootstrap();

		assert.containKeys(context.app.get(Identifiers.Crypto), [
			"network",
			"exceptions",
			"milestones",
			"genesisBlock",
		]);
	});
});
