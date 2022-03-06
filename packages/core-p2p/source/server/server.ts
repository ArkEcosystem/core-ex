import { inject, injectable, tagged } from "@arkecosystem/core-container";
import { Contracts, Identifiers } from "@arkecosystem/core-contracts";
import { Providers } from "@arkecosystem/core-kernel";
import fastify, { FastifyInstance, FastifyRequest } from "fastify";
import { v4 } from "uuid";

import { ResponseHandler } from "./contracts";
import { GetCommonBlocksHandler } from "./handlers/common-blocks";
import { GetBlocksHandler } from "./handlers/get-blocks";
import { GetPeerStatusHandler } from "./handlers/peer-status";
import { PostBlockHandler } from "./handlers/post-block";
import { PostTransactionsHandler } from "./handlers/post-transactions";

@injectable()
export class Server {
	@inject(Identifiers.Application)
	private readonly app!: Contracts.Kernel.Application;

	@inject(Identifiers.PluginConfiguration)
	@tagged("plugin", "core-p2p")
	private readonly configuration!: Providers.PluginConfiguration;

	@inject(Identifiers.LogService)
	private readonly logger!: Contracts.Kernel.Logger;

	@inject(ResponseHandler.GetBlocks)
	private readonly getBlocksHandler!: GetBlocksHandler;

	@inject(ResponseHandler.GetCommonBlocks)
	private readonly getCommonBlocksHandler!: GetCommonBlocksHandler;

	@inject(ResponseHandler.GetPeerStatus)
	private readonly getPeerStatusHandler!: GetPeerStatusHandler;

	@inject(ResponseHandler.PostBlock)
	private readonly postBlockHandler!: PostBlockHandler;

	@inject(ResponseHandler.PostTransactions)
	private readonly postTransactionsHandler!: PostTransactionsHandler;

	private server: FastifyInstance;

	#address: string;

	public async register(): Promise<void> {
		this.server = fastify({
			bodyLimit: 2_097_152,
			disableRequestLogging: true,
			genReqId: () => v4(),
			logger: false,
		});

		await this.server.register(require("fastify-compress"));

		await this.server.register(require("fastify-response-validation"));

		await this.server.register(require("fastify-helmet"));

		await this.server.register(require("fastify-sensible"));

		await this.#registerRoutes();
	}

	public async boot(): Promise<void> {
		try {
			// @ts-ignore
			this.#address = await this.server.listen(this.configuration.get("server.port"), this.configuration.get("server.hostname"));

			this.logger.info(`P2P server listening on ${this.#address}`);
		} catch (error) {
			console.log(error);
			await this.app.terminate(`Failed to start libp2p!`);
		}
	}

	public async dispose(): Promise<void> {
		try {
			await this.server.close();

			this.logger.info(`Terminated P2P server listening on ${this.#address}`);
		} catch {
			await this.app.terminate(`Failed to stop libp2p!`);
		}
	}

	async #registerRoutes(): Promise<void> {
		this.server.get(
			"/blocks",
			{
				schema: {
					headers: {
						properties: {
							version: { type: "string" },
						},
						type: "object",
					},
					querystring: {
						properties: {
							blockLimit: { maximum: 400, minimum: 1, type: "integer" },
							headersOnly: { type: "boolean" },
							lastBlockHeight: { minimum: 1, type: "integer" },
							serialized: { type: "boolean" },
						},
						type: "object",
					},
				},
			},
			async (request: FastifyRequest) => this.getBlocksHandler.handle(request),
		);

		this.server.post(
			"/blocks",
			{
				schema: {
					body: {
						properties: {
							block: { pattern: "^[0123456789A-Fa-f]+$", type: "string" },
						},
						type: "object",
					},
					headers: {
						properties: {
							version: { type: "string" },
						},
						type: "object",
					},
				},
			},
			async (request: FastifyRequest) => this.postBlockHandler.handle(request),
		);

		this.server.post(
			"/blocks/common",
			{
				schema: {
					headers: {
						properties: {
							version: { type: "string" },
						},
						type: "object",
					},
					querystring: {
						properties: {
							// @TODO strings are block ids
							ids: { items: { type: "string" }, maxItems: 10, minItems: 1, type: "array" },
						},
						type: "object",
					},
				},
			},
			async (request: FastifyRequest) => this.getCommonBlocksHandler.handle(request),
		);

		this.server.get(
			"/peers",
			{
				schema: {
					headers: {
						properties: {
							version: { type: "string" },
						},
						type: "object",
					},
				},
			},
			async (request: FastifyRequest) => this.getPeerStatusHandler.handle(request),
		);

		this.server.get(
			"/status",
			{
				schema: {
					headers: {
						properties: {
							version: { type: "string" },
						},
						type: "object",
					},
				},
			},
			async (request: FastifyRequest) => this.getPeerStatusHandler.handle(request),
		);

		this.server.post(
			"/transactions",
			{
				schema: {
					body: {
						properties: {
							// @TODO: better schema
							transactions: { type: "object" },
						},
						type: "object",
					},
					headers: {
						properties: {
							version: { type: "string" },
						},
						type: "object",
					},
				},
			},
			async (request: FastifyRequest) => this.postTransactionsHandler.handle(request),
		);
	}
}
