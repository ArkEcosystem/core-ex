import { Ajv } from "ajv";

import { isValidPeer } from "./is-valid-peer";

export const registerFormats = (configManager) => {
	const vendorField = (ajv: Ajv) => {
		ajv.addFormat("vendorField", (data) => {
			try {
				return Buffer.from(data, "utf8").length <= configManager.getMilestone().vendorFieldLength;
			} catch {
				return false;
			}
		});
	};

	const validPeer = (ajv: Ajv) => {
		ajv.addFormat("peer", (ip: string) => {
			try {
				return isValidPeer({ ip }, false);
			} catch {
				return false;
			}
		});
	};

	return [vendorField, validPeer];
}
