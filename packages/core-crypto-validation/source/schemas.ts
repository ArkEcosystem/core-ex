export const schemas = {
	alphanumeric: {
		$id: "alphanumeric",
		pattern: "^[a-zA-Z0-9]+$",
		type: "string",
	},

	hex: {
		$id: "hex",
		pattern: "^[0123456789A-Fa-f]+$",
		type: "string",
	},

	networkByte: {
		$id: "networkByte",
		network: true,
	},

	// TODO: Uri format is missing
	uri: {
		$id: "uri",
		allOf: [{ format: "uri" }, { maxLength: 80, minLength: 4 }],
	},
};
