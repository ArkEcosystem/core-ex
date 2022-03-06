import { Providers } from "@arkecosystem/core-kernel";
import { Identifiers } from "packages/core-contracts/distribution";

import { PubSubHandler } from "./contracts";
import { GetCommonBlocksHandler } from "./controllers/common-blocks";
import { GetBlocksHandler } from "./controllers/get-blocks";
import { GetPeerStatusHandler } from "./controllers/peer-status";
import { PostBlockHandler } from "./controllers/post-block";
import { PostTransactionsHandler } from "./controllers/post-transactions";
import { Server } from "./server";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		this.app.bind(PubSubHandler.GetBlocks).to(GetBlocksHandler).inSingletonScope();
		this.app.bind(PubSubHandler.GetCommonBlocks).to(GetCommonBlocksHandler).inSingletonScope();
		this.app.bind(PubSubHandler.GetPeerStatus).to(GetPeerStatusHandler).inSingletonScope();
		this.app.bind(PubSubHandler.PostBlock).to(PostBlockHandler).inSingletonScope();
		this.app.bind(PubSubHandler.PostTransactions).to(PostTransactionsHandler).inSingletonScope();

		this.app.bind(Identifiers.P2PServer).to(Server).inSingletonScope();

		await this.app.get<Server>(Identifiers.P2PServer).register();
	}

	public async boot(): Promise<void> {
		await this.app.get<Server>(Identifiers.P2PServer).boot();
	}

	public async dispose(): Promise<void> {
		await this.app.get<Server>(Identifiers.P2PServer).dispose();
	}

	public async required(): Promise<boolean> {
		return true;
	}
}
