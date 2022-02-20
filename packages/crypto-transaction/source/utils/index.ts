import { SATOSHI } from "../constants";
import { Configuration } from "@arkecosystem/crypto-config";
import { BigNumber } from "@arkecosystem/utils";

let genesisTransactions: { [key: string]: boolean };
let currentNetwork: number;

export const formatSatoshi = (configManager: Configuration, amount: BigNumber): string => {
	const localeString = (+amount / SATOSHI).toLocaleString("en", {
		maximumFractionDigits: 8,
		minimumFractionDigits: 0,
	});

	return `${localeString} ${configManager.get("network.client.symbol")}`;
};

export const isGenesisTransaction = (configManager: Configuration, id: string): boolean => {
	const network: number = configManager.get("network.pubKeyHash");

	if (!genesisTransactions || currentNetwork !== network) {
		currentNetwork = network;

		genesisTransactions = Object.fromEntries(
			configManager.get("genesisBlock.transactions").map((curr) => [curr.id, true]),
		);
	}

	return genesisTransactions[id];
};

export const numberToHex = (num: number, padding = 2): string => {
	const indexHex: string = Number(num).toString(16);

	return "0".repeat(padding - indexHex.length) + indexHex;
};

export const maxVendorFieldLength = (configManager: Configuration, height?: number): number => configManager.getMilestone(height).vendorFieldLength;

export const isSupportedTransactionVersion = (configManager: Configuration, version: number): boolean => {
	const aip11: boolean = configManager.getMilestone().aip11;

	if (aip11 && version !== 2) {
		return false;
	}

	if (!aip11 && version !== 1) {
		return false;
	}

	return true;
};

export { Base58 } from "./base58";
