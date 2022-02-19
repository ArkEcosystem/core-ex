export const numberToHex = (num: number, padding = 2): string => {
	const indexHex: string = Number(num).toString(16);

	return "0".repeat(padding - indexHex.length) + indexHex;
};

export const maxVendorFieldLength = (height?: number): number => configManager.getMilestone(height).vendorFieldLength;

export { BigNumber } from "./bignum";
export { ByteBuffer } from "./byte-buffer";
export { isLocalHost, isValidPeer } from "./is-valid-peer";
