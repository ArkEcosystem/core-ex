export const schemas = {
	address: {
		$id: "address",
		allOf: [
			{
				maxLength: 62,
				minLength: 62,
				pattern: "^[0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz]+$",
			},
		],
		type: "string",
	},
};
