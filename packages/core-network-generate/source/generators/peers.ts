import { writeJSONSync } from "fs-extra";
import { join } from "path";

export class PeersGenerator {
	#data = ["127.0.0.1"];

	get(): string[] {
		return this.#data;
	}

	generate(peers: string[]): PeersGenerator {
		this.#data = peers;

		return this;
	}

	write(dataPath: string) {
		writeJSONSync(
			join(dataPath, "peers.json"),
			{ list: this.#data },
			{
				spaces: 4,
			},
		);
	}
}
