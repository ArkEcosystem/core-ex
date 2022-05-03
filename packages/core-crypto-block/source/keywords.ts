import { AnySchemaObject, KeywordDefinition } from "ajv";

export const blockId: KeywordDefinition = {
	compile(schema) {
		return (data, parentSchema: AnySchemaObject) => {
			if (parentSchema.parentData?.height === 1 && schema.allowNullWhenGenesis && (!data || Number(data) === 0)) {
				return true;
			}

			if (typeof data !== "string") {
				return false;
			}

			return /^[\da-f]{64}$/i.test(data);
		};
	},
	errors: false,
	keyword: "blockId",
	metaSchema: {
		// additionalItems: false,
		properties: {
			allowNullWhenGenesis: { type: "boolean" },
			// isPreviousBlock: { type: "boolean" }, // TODO: Remove
		},
		type: "object",
	},
};
