import { describe } from "@arkecosystem/core-test";

import { AddressFactory } from "./index";

const mnemonic: string =
    "program fragile industry scare sun visit race erase daughter empty anxiety cereal cycle hunt airport educate giggle picture sunset apart jewel similar pulp moment";

describe("AddressFactory", ({ assert, it }) => {
    it("should derive an address from an mnemonic", () => {
        assert.is(
            new AddressFactory(
                {
                    prefix: "mod",
                },
                new Secp256k1Factory(),
            ).fromMnemonic(mnemonic),
            "",
        );
    });
});
