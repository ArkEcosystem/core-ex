import "jest-extended";

import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../../test";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { TransactionType } from "../enums";
import { InternalTransactionType } from "../types";
import { DelegateResignationTransaction } from "../types/two";
import { DelegateResignationBuilder } from "./delegate-resignation";

let builder: DelegateResignationBuilder;
let configManager: ConfigManager;
let builderFactory: TransactionBuilderFactory;

beforeEach(() => {
    const typesMap = new Map();
    const internalType: InternalTransactionType = InternalTransactionType.from(
        DelegateResignationTransaction.type,
        DelegateResignationTransaction.typeGroup,
    );
    typesMap.set(internalType, new Map().set(DelegateResignationTransaction.version, DelegateResignationTransaction));
    const services = createServices("testnet");
    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
});

describe("Delegate Resignation Transaction", () => {
    beforeEach(() => {
        builder = builderFactory.delegateResignation();
    });
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder.sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder.sign("dummy passphrase").secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("properties", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", TransactionType.DelegateResignation);
            expect(builder).toHaveProperty("data.amount", BigNumber.ZERO);
            //expect(builder).toHaveProperty("data.fee", DelegateResignationTransaction.staticFee());
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        });

        it("should not have the username yet", () => {
            expect(builder).not.toHaveProperty("data.username");
        });
    });
});
