import { Application } from "../../application";
import { LoadCryptography } from "./load-cryptography";
import { Container, Identifiers } from "../../ioc";
import { ConfigRepository } from "../../services/config";
import { describe } from "../../../../core-test-framework";

describe<{
	app: Application;
	configRepository: ConfigRepository;
}>("LoadCryptography", ({ assert, beforeEach, it }) => {
	beforeEach((context) => {
		context.app = new Application(new Container());
		context.configRepository = context.app.get<ConfigRepository>(Identifiers.ConfigRepository);
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
				genesisBlock: {},
				exceptions: {},
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
