import { Application, Container } from "@arkecosystem/core-kernel";
import { Configuration } from "@arkecosystem/core-crypto-config";
import { BINDINGS, IConfiguration } from "@arkecosystem/core-crypto-contracts";
import { ServiceProvider as ECDSA } from "@arkecosystem/core-crypto-key-pair-ecdsa";
import { ServiceProvider as Schnorr } from "@arkecosystem/core-crypto-key-pair-schnorr";
import { describe } from "@arkecosystem/core-test-framework";

import { AddressFactory } from "./address.factory";

const mnemonic =
	"program fragile industry scare sun visit race erase daughter empty anxiety cereal cycle hunt airport educate giggle picture sunset apart jewel similar pulp moment";

describe<{ app: Application }>("AddressFactory", ({ assert, beforeEach, it }) => {
	beforeEach((context) => {
		context.app = new Application(new Container.Container());
		context.app.bind(BINDINGS.Configuration).to(Configuration).inSingletonScope();

		context.app.get<IConfiguration>(BINDINGS.Configuration).setConfig({
			milestones: [],
			network: {
				// @ts-ignore
				address: {
					base58: 23,
				},
			},
		});
	});

	it("should derive an address from an mnemonic (schnorr)", async (context) => {
		await context.app.resolve<Schnorr>(Schnorr).register();

		assert.is(
			await context.app.resolve(AddressFactory).fromMnemonic(mnemonic),
			"AcYBXbtvzjYhRnNoJEC7E4ybnbkjrezbX8",
		);
	});

	it("should derive an address from an mnemonic (secp256k1)", async (context) => {
		await context.app.resolve<ECDSA>(ECDSA).register();

		assert.is(
			await context.app.resolve(AddressFactory).fromMnemonic(mnemonic),
			"AFsmMfUo2MrcwPnoF3Liqu36dSd3o8yYVu",
		);
	});

	it("should derive an address from a public key (schnorr)", async (context) => {
		await context.app.resolve<Schnorr>(Schnorr).register();

		assert.is(
			await context.app
				.resolve(AddressFactory)
				.fromPublicKey(Buffer.from("e84093c072af70004a38dd95e34def119d2348d5261228175d032e5f2070e19f", "hex")),
			"AcYBXbtvzjYhRnNoJEC7E4ybnbkjrezbX8",
		);
	});

	it("should derive an address from a public key (secp256k1)", async (context) => {
		await context.app.resolve<ECDSA>(ECDSA).register();

		assert.is(
			await context.app
				.resolve(AddressFactory)
				.fromPublicKey(
					Buffer.from("03e84093c072af70004a38dd95e34def119d2348d5261228175d032e5f2070e19f", "hex"),
				),
			"AFsmMfUo2MrcwPnoF3Liqu36dSd3o8yYVu",
		);
	});

	it("should validate addresses", async (context) => {
		await context.app.resolve<ECDSA>(ECDSA).register();

		assert.true(await context.app.resolve(AddressFactory).validate("AFsmMfUo2MrcwPnoF3Liqu36dSd3o8yYVu"));
		assert.true(await context.app.resolve(AddressFactory).validate("AFsmMfUo2MrcwPnoF3Liqu36dSd3o8yYVu"));
		assert.false(
			await context.app
				.resolve(AddressFactory)
				.validate("m0d1q05ypy7qw2hhqqz28rwetc6dauge6g6g65npy2qht5pjuheqwrse7gxkhwv"),
		);
	});
});