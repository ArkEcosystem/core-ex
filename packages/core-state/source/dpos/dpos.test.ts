import { Application, Services, Utils } from "@arkecosystem/core-kernel";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Container, injectable } from "@arkecosystem/core-container";
import { BigNumber } from "@arkecosystem/utils";
import { describe } from "../../../core-test-framework";
import { AddressFactory } from "../../../core-crypto-address-base58/source/address.factory";
import { KeyPairFactory } from "../../../core-crypto-key-pair-schnorr/source/pair";
import { PublicKeyFactory } from "../../../core-crypto-key-pair-schnorr/source/public";

import { buildValidatorAndVoteWallets } from "../../test/build-validator-and-vote-balances";
import { registerIndexers, WalletRepository } from "../wallets";
import { DposState } from "./dpos";
import { Configuration } from "../../../core-crypto-config";
import { walletFactory } from "../wallets/wallet-factory";
import { spy } from "sinon";

describe<{
	app: Application;
	dposState: DposState;
	walletRepo: WalletRepository;
	round: Contracts.Shared.RoundInfo;
	configuration: Contracts.Crypto.IConfiguration;
	logger: Contracts.Kernel.Logger;
}>("dpos", ({ it, beforeEach, assert }) => {
	beforeEach(async (context) => {
		context.logger = {
			debug: () => {},
			error: () => {},
			info: () => {},
			warning: () => {},
		} as any;

		context.app = new Application(new Container());
		context.app.bind(Identifiers.LogService).toConstantValue(context.logger);
		context.app.bind(Identifiers.Cryptography.Configuration).to(Configuration).inSingletonScope();

		context.configuration = context.app.get<Contracts.Crypto.IConfiguration>(
			Identifiers.Cryptography.Configuration,
		);
		context.configuration.setConfig({
			milestones: [
				{
					address: {
						base58: 23,
					},
				},
			],
		} as any);

		context.app.bind(Identifiers.Cryptography.Identity.AddressFactory).to(AddressFactory).inSingletonScope();
		context.app.bind(Identifiers.Cryptography.Identity.KeyPairFactory).to(KeyPairFactory).inSingletonScope();
		context.app.bind(Identifiers.Cryptography.Identity.PublicKeyFactory).to(PublicKeyFactory).inSingletonScope();

		context.app.bind(Identifiers.WalletAttributes).to(Services.Attributes.AttributeSet).inSingletonScope();
		const attributes = context.app.get<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes);
		attributes.set("validator");
		attributes.set("validator.username");
		attributes.set("validator.voteBalance");
		attributes.set("validator.producedBlocks");
		attributes.set("validator.forgedTotal");
		attributes.set("validator.approval");
		attributes.set("vote");
		attributes.set("validator.resigned");
		attributes.set("validator.rank");
		attributes.set("validator.round");

		@injectable()
		class MockEventDispatcher {
			public dispatch(data) {
				return spy()(data);
			}

			public dispatchSync(...data) {
				return spy()(...data);
			}
		}

		context.app.bind(Identifiers.EventDispatcherService).to(MockEventDispatcher);
		context.app.bind(Identifiers.WalletRepository).to(WalletRepository);
		context.app
			.bind(Identifiers.WalletFactory)
			.toFactory(({ container }) =>
				walletFactory(
					container.get(Identifiers.WalletAttributes),
					container.get(Identifiers.EventDispatcherService),
				),
			);

		registerIndexers(context.app);

		context.app.bind(Identifiers.DposState).to(DposState).inSingletonScope();

		context.dposState = context.app.get<DposState>(Identifiers.DposState);
		context.walletRepo = context.app.get<WalletRepository>(Identifiers.WalletRepository);

		await buildValidatorAndVoteWallets(
			context.app.get(Identifiers.Cryptography.Identity.AddressFactory),
			5,
			context.walletRepo,
		);
	});

	it.skip("should update delegate votes of htlc locked balances", async (context) => {
		await context.dposState.buildVoteBalances();

		const delegates = context.walletRepo.allByUsername();

		for (let i = 0; i < 5; i++) {
			const delegate = delegates[4 - i];
			const total = BigNumber.make(5 - i)
				.times(1000)
				.times(BigNumber.SATOSHI);

			assert.equal(delegate.getAttribute<BigNumber>("validator.voteBalance"), total);
		}
	});

	it.only("buildValidatorRanking - should build ranking and sort delegates by vote balance", async (context) => {
		await context.dposState.buildVoteBalances();
		context.dposState.buildValidatorRanking();

		const delegates = context.dposState.getActiveValidators();
		assert.is(delegates.length, 5);

		for (let i = 0; i < 5; i++) {
			const delegate = delegates[i];
			const total = BigNumber.make((5 - i) * 1000).times(BigNumber.SATOSHI);

			assert.equal(delegate.getAttribute<number>("validator.rank"), i + 1);
			assert.equal(delegate.getAttribute<BigNumber>("validator.voteBalance"), total);
		}
	});

	it("buildValidatorRanking - should throw if two wallets have the same public key", async (context) => {
		const delegates = await buildValidatorAndVoteWallets(
			context.app.get(Identifiers.Cryptography.Identity.AddressFactory),
			5,
			context.walletRepo,
		);
		delegates[0].setAttribute("delegate.resigned", true);

		delegates[1].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));
		delegates[2].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));
		delegates[1].setPublicKey("03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece");
		delegates[2].setPublicKey("03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece");
		context.walletRepo.index(delegates[2]);

		assert.throws(
			() => context.dposState.buildValidatorRanking(),
			'The balance and public key of both delegates are identical! Delegate "delegate2" appears twice in the list.',
		);
	});

	it("buildValidatorRanking - should not throw if public keys are different and balances are the same", async (context) => {
		const delegates = await buildValidatorAndVoteWallets(
			context.app.get(Identifiers.Cryptography.Identity.AddressFactory),
			5,
			context.walletRepo,
		);

		delegates[1].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));
		delegates[2].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));

		assert.not.throws(() => context.dposState.buildValidatorRanking());
		assert.equal(delegates[1].getAttribute("delegate.rank"), 1);
		assert.equal(delegates[2].getAttribute("delegate.rank"), 2);
		assert.equal(delegates[0].getAttribute("delegate.rank"), 3);
	});

	it("setValidatorsRound - should throw if there are not enough delegates", (context) => {
		context.dposState.buildVoteBalances();
		context.dposState.buildValidatorRanking();
		const round = Utils.roundCalculator.calculateRound(1, context.configuration);

		assert.throws(
			() => context.dposState.setValidatorsRound(round),
			`Expected to find 51 delegates but only found 5.This indicates an issue with the genesis block & delegates`,
		);
	});

	it("setValidatorsRound - should set the delegates of a round", async (context) => {
		await context.dposState.buildVoteBalances();
		context.dposState.buildValidatorRanking();
		const round = Utils.roundCalculator.calculateRound(1, context.configuration);
		round.maxValidators = 4;
		context.dposState.setValidatorsRound(round);
		const delegates = context.dposState.getActiveValidators();
		const roundDelegates = context.dposState.getRoundValidators();

		assert.equal(context.dposState.getRoundInfo(), round);
		assert.equal(roundDelegates, delegates.slice(0, 4));

		for (let i = 0; i < round.maxValidators; i++) {
			const delegate = await context.walletRepo.findByPublicKey(roundDelegates[i].getPublicKey()!);

			assert.equal(delegate.getAttribute("delegate.round"), round.round);
		}

		// TODO: when we remove Assertion checks, this won't throw
		// instead it should not.toEqual(round)
		assert.throws(() => delegates[4].getAttribute("delegate.round"));
		assert.true(context.logger.calledWith("Loaded 4 active delegates"));
	});

	it("should run all getters", async (context) => {
		await context.dposState.buildVoteBalances();
		context.dposState.buildValidatorRanking();
		context.round = Utils.roundCalculator.calculateRound(1, context.configuration);
		context.round.maxValidators = 5;
		context.dposState.setValidatorsRound(context.round);

		assert.equal(context.dposState.getRoundInfo(), context.round);
		assert.equal(context.dposState.getAllValidators(), context.walletRepo.allByUsername());
		assert.containValues(context.dposState.getActiveValidators(), context.walletRepo.allByUsername());
		assert.containValues(context.dposState.getRoundValidators(), context.walletRepo.allByUsername());
	});
});
