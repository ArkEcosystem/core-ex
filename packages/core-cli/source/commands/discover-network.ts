import { existsSync, readdirSync } from "fs-extra";
import prompts from "prompts";

import { injectable } from "../ioc";

@injectable()
export class DiscoverNetwork {
	public async discover(path: string, usePrompts = true): Promise<string> {
		if (!existsSync(path)) {
			throw new Error(`The [${path}] directory does not exist.`);
		}

		const folders: string[] = readdirSync(path).filter((folder) => this.#isValidNetwork(folder));

		if (!folders || folders.length === 0) {
			throw new Error(
				'We were unable to detect a network configuration. Please run "ark config:publish" and try again.',
			);
		}

		if (folders.length === 1) {
			return folders[0];
		}

		if (!usePrompts) {
			throw new Error(`Cannot determine network from directory [${path}]`);
		}

		return this.discoverWithPrompt(folders);
	}

	public async discoverWithPrompt(folders: string[]): Promise<string> {
		const response = await prompts([
			{
				choices: folders
					.filter((folder) => this.#isValidNetwork(folder))
					.map((folder) => ({ title: folder, value: folder })),
				message: "What network do you want to operate on?",
				name: "network",
				type: "select",
			},
			{
				message: "Can you confirm?",
				name: "confirm",
				type: "confirm",
			},
		]);

		if (!response.confirm) {
			throw new Error("You'll need to confirm the network to continue.");
		}

		if (!this.#isValidNetwork(response.network)) {
			throw new Error(`The given network "${response.network}" is not valid.`);
		}

		return response.network;
	}

	#isValidNetwork(network: string): boolean {
		return ["livenet", "testnet"].includes(network);
	}
}
