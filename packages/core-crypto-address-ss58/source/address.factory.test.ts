import { Configuration } from "@arkecosystem/core-crypto-config";
import { BINDINGS, IConfiguration } from "@arkecosystem/core-crypto-contracts";
import { ServiceProvider as ECDSA } from "@arkecosystem/core-crypto-key-pair-ecdsa";
import { ServiceProvider as Schnorr } from "@arkecosystem/core-crypto-key-pair-schnorr";
import { Application, Container } from "@arkecosystem/core-kernel";
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
					ss58: 0,
				},
			},
		});
	});

	it("should derive an address from an mnemonic (schnorr)", async (context) => {
		await context.app.resolve<Schnorr>(Schnorr).register();

		assert.is(
			await context.app.resolve(AddressFactory).fromMnemonic(mnemonic),
			"16FXHyZ8GWJ3SV7gaDpmVkHoLnJzEDN3UjQAnriU6VAg4hNi",
		);
	});

	it("should derive an address from an mnemonic (secp256k1)", async (context) => {
		await context.app.resolve<ECDSA>(ECDSA).register();

		assert.is(
			await context.app.resolve(AddressFactory).fromMnemonic(mnemonic),
			"1PcW4xBLRNvDufL5HpTqdT65HEjsPmFc3Z4ZdueNV3x8uVc2",
		);
	});

	it("should derive an address from a public key (schnorr)", async (context) => {
		await context.app.resolve<Schnorr>(Schnorr).register();

		assert.is(
			await context.app
				.resolve(AddressFactory)
				.fromPublicKey(Buffer.from("e84093c072af70004a38dd95e34def119d2348d5261228175d032e5f2070e19f", "hex")),
			"16FXHyZ8GWJ3SV7gaDpmVkHoLnJzEDN3UjQAnriU6VAg4hNi",
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
			"1PcW4xBLRNvDufL5HpTqdT65HEjsPmFc3Z4ZdueNV3x8uVc2",
		);
	});

	it("should validate addresses", async (context) => {
		await context.app.resolve<ECDSA>(ECDSA).register();

		assert.true(
			await context.app.resolve(AddressFactory).validate("1PcW4xBLRNvDufL5HpTqdT65HEjsPmFc3Z4ZdueNV3x8uVc2"),
		);
		assert.true(
			await context.app.resolve(AddressFactory).validate("1PcW4xBLRNvDufL5HpTqdT65HEjsPmFc3Z4ZdueNV3x8uVc2"),
		);
		assert.false(
			await context.app
				.resolve(AddressFactory)
				.validate("m0d1q05ypy7qw2hhqqz28rwetc6dauge6g6g65npy2qht5pjuheqwrse7gxkhwv"),
		);
	});
});