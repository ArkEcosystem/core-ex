import "jest-extended";

import * as constants from "./constants";

describe("Constants", () => {
    it("satoshi is valid", () => {
        expect(constants.SATOSHI).toBeDefined();
        expect(constants.SATOSHI).toBe(100000000);
    });
});
