export const min = (values: number[]): number => {
	let min: number = values[0];

	for (const value: number of values) {

		min = value < min ? value : min;
	}

	return min;
};
