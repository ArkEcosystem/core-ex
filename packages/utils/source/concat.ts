import { isArray } from "./is-array";

export const concat = <T>(...values: any[]): T[] => {
	const result: T[] = [];

	for (const item: T | T[] of values) {

		if (isArray(item)) {
			const childLength: number = item.length;

			for (let index = 0; index < childLength; index++) {
				result.push(item[index]);
			}
		} else {
			result.push(item);
		}
	}

	return result;
};
