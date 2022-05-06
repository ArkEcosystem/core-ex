import { AnySchemaObject } from "ajv";

export const schemas: Record<"alphanumeric" | "hex", AnySchemaObject> = {
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
};
