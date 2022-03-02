import Contracts, { Identifiers } from "@arkecosystem/core-contracts";
import { Container, Providers } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

import { RateLimiter } from "../../rate-limiter";
import { buildRateLimiter } from "../../utils/build-rate-limiter";
import { BlocksRoute } from "../routes/blocks";
import { InternalRoute } from "../routes/internal";
import { PeerRoute } from "../routes/peer";
import { TransactionsRoute } from "../routes/transactions";

@Container.injectable()
export class RateLimitPlugin {
	@Container.inject(Identifiers.Application)
	protected readonly app!: Contracts.Kernel.Application;

	@Container.inject(Identifiers.PluginConfiguration)
	@Container.tagged("plugin", "core-p2p")
	private readonly configuration!: Providers.PluginConfiguration;

	private rateLimiter!: RateLimiter;

	public register(server) {
		this.rateLimiter = buildRateLimiter({
			rateLimit: this.configuration.getOptional<number>("rateLimit", 100),
			rateLimitPostTransactions: this.configuration.getOptional<number>("rateLimitPostTransactions", 25),
			remoteAccess: this.configuration.getOptional<Array<string>>("remoteAccess", []),
			whitelist: [],
		});

		const allRoutesConfigByPath = {
			...this.app.resolve(InternalRoute).getRoutesConfigByPath(),
			...this.app.resolve(PeerRoute).getRoutesConfigByPath(),
			...this.app.resolve(BlocksRoute).getRoutesConfigByPath(),
			...this.app.resolve(TransactionsRoute).getRoutesConfigByPath(),
		};

		server.ext({
			method: async (request, h) => {
				const endpoint = allRoutesConfigByPath[request.path].id;

				if (await this.rateLimiter.hasExceededRateLimit(request.info.remoteAddress, endpoint)) {
					return Boom.tooManyRequests("Rate limit exceeded");
				}
				return h.continue;
			},
			type: "onPreAuth",
		});
	}
}
