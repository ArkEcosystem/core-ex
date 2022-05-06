import { AnySchemaObject } from "ajv";

export const schemas: Record<"alphanumeric" | "alphanumericMixedCase" | "hex", AnySchemaObject> = {
	alphanumeric: {
		$id: "alphanumeric",
		pattern: "^[a-z0-9]+$",
		type: "string",
	},
	alphanumericMixedCase: {
		$id: "alphanumericMixedCase",
		pattern: "^[A-Za-z0-9]+$",
		type: "string",
	},
	hex: {
		$id: "hex",
		pattern: "^[0123456789a-f]+$",
		type: "string",
	},
};
