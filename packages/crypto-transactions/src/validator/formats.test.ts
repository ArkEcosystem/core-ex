import "jest-extended";

import { testnet } from "../../test/networks";
import { ConfigManager } from "../config";
import { TransactionValidator } from "./";

//@ts-ignore
const configManager = new ConfigManager(testnet);
const transactionValidator = new TransactionValidator(configManager);
const ajv = (transactionValidator as any).ajv;

describe("format vendorField", () => {
    it("should be ok with 64 bytes", () => {
        const schema = { type: "string", format: "vendorField" };
        const validate = ajv.compile(schema);

        expect(validate("1234")).toBeTrue();
        expect(validate("a".repeat(64))).toBeTrue();
        expect(validate("a".repeat(65))).toBeFalse();
        expect(validate("⊁".repeat(21))).toBeTrue();
        expect(validate("⊁".repeat(22))).toBeFalse();
        expect(validate({})).toBeFalse();
        expect(validate(null)).toBeFalse();
        expect(validate(undefined)).toBeFalse();
    });

    it("should not be ok with over 64 bytes without milestone", () => {
        const schema = { type: "string", format: "vendorField" };
        const validate = ajv.compile(schema);
        expect(validate("a".repeat(65))).toBeFalse();
    });

    it("should be ok with up to 255 bytes with milestone", () => {
        configManager.getMilestone().vendorFieldLength = 255;
        const schema = { type: "string", format: "vendorField" };
        const validate = ajv.compile(schema);
        expect(validate("a".repeat(65))).toBeTrue();
        expect(validate("⊁".repeat(85))).toBeTrue();
        expect(validate("a".repeat(256))).toBeFalse();
        expect(validate("⊁".repeat(86))).toBeFalse();

        configManager.getMilestone().vendorFieldLength = 64;
    });
});
