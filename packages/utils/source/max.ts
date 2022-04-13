export const max = (values: number[]): number => {
	let max: number = values[0];

	for (const value: number of values) {

		max = value > max ? value : max;
	}

	return max;
};
