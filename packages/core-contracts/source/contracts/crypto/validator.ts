import Ajv, { ErrorObject, FormatDefinition, KeywordDefinition } from "ajv";

export interface ISchemaValidationResult<T = any> {
	value: T | undefined;
	error: any;
	errors?: ErrorObject[] | undefined;
}

export interface IValidator {
	validate<T = any>(schemaKeyReference: string | boolean | object, data: T): ISchemaValidationResult<T>;

	addFormat(name: string, format: FormatDefinition<string | number>): void;

	addKeyword(definition: KeywordDefinition): void;

	addSchema(schema: object | object[], key?: string): void;

	removeKeyword(keyword: string): void;

	removeSchema(schemaKeyReference: string | boolean | object | RegExp): void;

	extend(callback: (ajv: Ajv) => void): void;
}
