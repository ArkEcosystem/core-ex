import { Contracts } from "@arkecosystem/core-contracts";
import Ajv from "ajv";

import { isValidPeer } from "./is-valid-peer";

export const registerFormats = (configuration: Contracts.Crypto.IConfiguration) => {
	// @TODO: plugins should register this rule
	const validPeer = (ajv: Ajv) => {
		ajv.addFormat("peer", (ip: string) => {
			try {
				return isValidPeer({ ip }, false);
			} catch {
				return false;
			}
		});
	};

	return { validPeer };
};
