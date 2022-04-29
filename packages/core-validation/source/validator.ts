import { injectable, postConstruct } from "@arkecosystem/core-container";
import { Contracts } from "@arkecosystem/core-contracts";
import Ajv, { AnySchema, FormatDefinition, KeywordDefinition } from "ajv";
import keywords from "ajv-keywords";

@injectable()
export class Validator implements Contracts.Crypto.IValidator {
	#ajv: Ajv;

	@postConstruct()
	public postConstruct(): void {
		this.#ajv = new Ajv({
			$data: true,
			// extendRefs: true,
			removeAdditional: true,
		});

		keywords(this.#ajv);
	}

	public validate<T = any>(
		schemaKeyReference: string | boolean | object,
		data: T,
	): Contracts.Crypto.ISchemaValidationResult<T> {
		try {
			this.#ajv.validate(schemaKeyReference, data);

			this.#ajv.errors;

			return {
				error: this.#ajv.errors ? this.#ajv.errorsText() : undefined,
				errors: this.#ajv.errors || undefined,
				value: data,
			};
		} catch (error) {
			return { error: error.stack, errors: [], value: undefined };
		}
	}

	public addFormat(name: string, format: FormatDefinition<string | number>): void {
		this.#ajv.addFormat(name, format);
	}

	public addKeyword(definition: KeywordDefinition): void {
		this.#ajv.addKeyword(definition);
	}

	public addSchema(schema: AnySchema | AnySchema[]): void {
		this.#ajv.addSchema(schema);
	}

	public removeKeyword(keyword: string): void {
		this.#ajv.removeKeyword(keyword);
	}

	public removeSchema(schemaKeyReference: string | boolean | object | RegExp): void {
		this.#ajv.removeSchema(schemaKeyReference);
	}

	public extend(callback: (ajv: Ajv) => void): void {
		callback(this.#ajv);
	}
}
