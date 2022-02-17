import Ajv from "ajv";
import ajvKeywords from "ajv-keywords";

import { ConfigManager } from "../config";
import { ISchemaValidationResult } from "../contracts";
import { signedSchema, strictSchema, TransactionSchema } from "../types/schemas";
import { createFormats } from "./formats";
import { createKeywords } from "./keywords";
import { schemas } from "./schemas";

export class TransactionValidator {
    private ajv: Ajv.Ajv;
    private keywords: any[];
    private formats: any[];
    private readonly transactionSchemas: Map<string, TransactionSchema> = new Map<string, TransactionSchema>();

    public constructor(config: ConfigManager, options: Record<string, any> = {}) {
        this.keywords = createKeywords(config);
        this.formats = createFormats(config);
        this.ajv = this.instantiateAjv(options);
    }

    public getInstance(): Ajv.Ajv {
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

    public addFormat(name: string, format: Ajv.FormatDefinition): void {
        this.ajv.addFormat(name, format);
    }

    public addKeyword(keyword: string, definition: Ajv.KeywordDefinition): void {
        this.ajv.addKeyword(keyword, definition);
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
        ajv: Ajv.Ajv,
        schemaKeyRef: string | boolean | object,
        data: T,
    ): ISchemaValidationResult<T> {
        try {
            ajv.validate(schemaKeyRef, data);

            const error = ajv.errors ? ajv.errorsText() : undefined;

            return { value: data, error, errors: ajv.errors || undefined };
        } catch (error) {
            return { value: undefined, error: error.stack, errors: [] };
        }
    }

    private instantiateAjv(options: Record<string, any>) {
        const ajv = new Ajv({
            ...{
                $data: true,
                schemas,
                removeAdditional: true,
                extendRefs: true,
            },
            ...options,
        });
        ajvKeywords(ajv);

        for (const addKeyword of this.keywords) {
            addKeyword(ajv);
        }

        for (const addFormat of this.formats) {
            addFormat(ajv);
        }

        return ajv;
    }

    private extendTransactionSchema(ajv: Ajv.Ajv, schema: TransactionSchema, remove?: boolean) {
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

    private updateTransactionArray(ajv: Ajv.Ajv) {
        ajv.removeSchema("block");
        ajv.removeSchema("transactions");
        ajv.addSchema({
            $id: "transactions",
            type: "array",
            additionalItems: false,
            items: { anyOf: [...this.transactionSchemas.keys()].map((schema) => ({ $ref: `${schema}Signed` })) },
        });
        ajv.addSchema(schemas.block);
    }
}
