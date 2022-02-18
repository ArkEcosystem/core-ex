import Ajv, { Format, KeywordDefinition } from "ajv";
import ajvKeywords from "ajv-keywords";
import addFormats from "ajv-formats";
import { ISchemaValidationResult } from "../interfaces";
import { signedSchema, strictSchema, TransactionSchema } from "../transactions/types/schemas";
import { formats } from "./formats";
import { keywords } from "./keywords";
import { schemas } from "./schemas";

export class Validator {
	private ajv: Ajv;
	private readonly transactionSchemas: Map<string, TransactionSchema> = new Map<string, TransactionSchema>();

	private constructor(options: Record<string, any>) {
		this.ajv = this.instantiateAjv(options);
	}

	public static make(options: Record<string, any> = {}): Validator {
		return new Validator(options);
	}

	public getInstance(): Ajv {
		return this.ajv;
	}

	public validate<T = any>(schemaKeyRef: string | boolean | object, data: T): ISchemaValidationResult<T> {
		return this.validateSchema(this.ajv, schemaKeyRef, data);
	}

	public validateException<T = any>(schemaKeyRef: string | boolean | object, data: T): ISchemaValidationResult<T> {
		const ajv = this.instantiateAjv({ allErrors: true, verbose: true });

		for (const schema of this.transactionSchemas.values()) {
			this.extendTransactionSchema(ajv, schema);
		}

		return this.validateSchema(ajv, schemaKeyRef, data);
	}

	public addFormat(name: string, format: Format): void {
		this.ajv.addFormat(name, format);
	}

	public addKeyword(definition: KeywordDefinition): void {
		this.ajv.addKeyword(definition);
	}

	public addSchema(schema: object | object[], key?: string): void {
		this.ajv.addSchema(schema, key);
	}

	public removeKeyword(keyword: string): void {
		this.ajv.removeKeyword(keyword);
	}

	public removeSchema(schemaKeyRef: string | boolean | object | RegExp): void {
		this.ajv.removeSchema(schemaKeyRef);
	}

	public extendTransaction(schema: TransactionSchema, remove?: boolean) {
		this.extendTransactionSchema(this.ajv, schema, remove);
	}

	private validateSchema<T = any>(
		ajv: Ajv,
		schemaKeyRef: string | boolean | object,
		data: T,
	): ISchemaValidationResult<T> {
		try {
			ajv.validate(schemaKeyRef, data);

			const error = ajv.errors ? ajv.errorsText() : undefined;

			return { error, errors: ajv.errors || undefined, value: data };
		} catch (error) {
			return { error: error.stack, errors: [], value: undefined };
		}
	}

	private instantiateAjv(options: Record<string, any>) {
		const ajv = new Ajv({
			$data: true,
			removeAdditional: true,
			schemas,
			jsPropertySyntax: true,
			...options,
		});

		// Register global keywords & formats...
		ajvKeywords(ajv);
		addFormats(ajv);

		for (const addKeyword of keywords) {
			addKeyword(ajv);
		}

		for (const addFormat of formats) {
			addFormat(ajv);
		}

		return ajv;
	}

	private extendTransactionSchema(ajv: Ajv, schema: TransactionSchema, remove?: boolean) {
		if (ajv.getSchema(schema.$id)) {
			remove = true;
		}

		if (remove) {
			this.transactionSchemas.delete(schema.$id);

			ajv.removeSchema(schema.$id);
			ajv.removeSchema(`${schema.$id}Signed`);
			ajv.removeSchema(`${schema.$id}Strict`);
		}

		this.transactionSchemas.set(schema.$id, schema);

		ajv.addSchema(schema);
		ajv.addSchema(signedSchema(schema));
		ajv.addSchema(strictSchema(schema));

		this.updateTransactionArray(ajv);
	}

	private updateTransactionArray(ajv: Ajv) {
		ajv.removeSchema("block");
		ajv.removeSchema("transactions");
		ajv.addSchema({
			$id: "transactions",
			items: { anyOf: [...this.transactionSchemas.keys()].map((schema) => ({ $ref: `${schema}Signed` })) },
			type: "array",
		});
		ajv.addSchema(schemas.block);
	}
}

export const validator = Validator.make();
