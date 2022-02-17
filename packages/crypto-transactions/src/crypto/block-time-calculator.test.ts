import "jest-extended";

import { createConfig } from "../../test";
import milestones from "../../test/fixtures/block-time-milestones.json";
import { ConfigManager } from "../config";
import { calculateBlockTime, isNewBlockTime } from "./block-time-calculator";

let configManager: ConfigManager;
beforeEach(() => (configManager = createConfig("devnet", { milestones })));

describe("BlockTimeCalculator", () => {
    describe("isNewBlock", () => {
        it("should calculate whether a given round contains a new blocktime", () => {
            expect(isNewBlockTime(1, configManager)).toBeTrue();
            expect(isNewBlockTime(10800, configManager)).toBeTrue();
            expect(isNewBlockTime(910000, configManager)).toBeTrue();
            expect(isNewBlockTime(920000, configManager)).toBeTrue();
            expect(isNewBlockTime(950000, configManager)).toBeTrue();
        });

        it("should return false is the height is not a new milestone", () => {
            expect(isNewBlockTime(2, configManager)).toBeFalse();
            expect(isNewBlockTime(10799, configManager)).toBeFalse();
            expect(isNewBlockTime(10801, configManager)).toBeFalse();
            expect(isNewBlockTime(960001, configManager)).toBeFalse();
        });

        it("should return false when a new milestone doesn't include a new blocktime", async () => {
            expect(isNewBlockTime(21600, configManager)).toBeFalse();
            expect(isNewBlockTime(960000, configManager)).toBeFalse();
        });

        it("should return false when the milestone includes the same blocktime", async () => {
            expect(isNewBlockTime(910004, configManager)).toBeFalse();
        });
    });

    describe("calculateBlockTime", () => {
        it("should calculate the blocktime from a given height", () => {
            expect(calculateBlockTime(1, configManager)).toEqual(8);
            expect(calculateBlockTime(10800, configManager)).toEqual(9);
            expect(calculateBlockTime(910000, configManager)).toEqual(11);

            expect(calculateBlockTime(950000, configManager)).toEqual(12);
        });

        it("should calculate blocktime from the last milestone where it was changes", () => {
            expect(isNewBlockTime(21600, configManager)).toBeFalse();
            expect(isNewBlockTime(900000, configManager)).toBeFalse();
            expect(isNewBlockTime(2, configManager)).toBeFalse();
            expect(isNewBlockTime(10799, configManager)).toBeFalse();
            expect(isNewBlockTime(970000, configManager)).toBeFalse();

            expect(calculateBlockTime(2, configManager)).toEqual(8);
            expect(calculateBlockTime(10799, configManager)).toEqual(8);

            expect(calculateBlockTime(21600, configManager)).toEqual(9);
            expect(calculateBlockTime(900000, configManager)).toEqual(9);
            expect(calculateBlockTime(970000, configManager)).toEqual(12);
        });

        it("should calculate blocktimes when they reduce to a previously used blocktime", () => {
            expect(isNewBlockTime(920000, configManager)).toBeTrue();

            expect(calculateBlockTime(920000, configManager)).toEqual(9);
        });

        it("should calculate latest milestone correctly when it doesn't change the blocktime", () => {
            expect(isNewBlockTime(960000, configManager)).toBeFalse();
            expect(calculateBlockTime(960000, configManager)).toEqual(12);
        });

        it("should throw an error when no blocktimes are specified in any milestones", () => {
            configManager.set("milestones", {});

            expect(isNewBlockTime(960000, configManager)).toBeFalse();
            expect(() => calculateBlockTime(960000, configManager)).toThrow(
                `No milestones specifying any height were found`,
            );
        });
    });
});
