import "jest-extended";

import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../../test";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { TransactionType } from "../enums";
import { MaximumPaymentCountExceededError } from "../errors";
import { Helpers } from "../helpers";
import { InternalTransactionType } from "../types";
import { MultiPaymentTransaction } from "../types/two";
import { MultiPaymentBuilder } from "./multi-payment";

let builder: MultiPaymentBuilder;
let configManager: ConfigManager;
let helpers: Helpers;
let builderFactory: TransactionBuilderFactory;

beforeEach(() => {
    const typesMap = new Map();
    const internalType: InternalTransactionType = InternalTransactionType.from(
        MultiPaymentTransaction.type,
        MultiPaymentTransaction.typeGroup,
    );
    typesMap.set(internalType, new Map().set(MultiPaymentTransaction.version, MultiPaymentTransaction));

    const services = createServices("testnet");
    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
});

describe("Multi Payment Transaction", () => {
    beforeEach(() => {
        builder = builderFactory.multiPayment();
    });

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.MultiPayment);
        //expect(builder).toHaveProperty("data.fee", Two.MultiPaymentTransaction.staticFee());
        expect(builder).toHaveProperty("data.asset.payments", []);
        expect(builder).toHaveProperty("data.vendorField", undefined);
    });

    describe("vendorField", () => {
        it("should set the vendorField", () => {
            const data = "dummy";
            builder.vendorField(data);
            expect(builder.data.vendorField).toBe(data);
        });
    });

    describe("addPayment", () => {
        it("should add new payments", () => {
            builder.addPayment("address", "1");
            builder.addPayment("address", "2");
            builder.addPayment("address", "3");

            expect(builder.data.asset!.payments).toEqual([
                {
                    amount: BigNumber.ONE,
                    recipientId: "address",
                },
                {
                    amount: BigNumber.make(2),
                    recipientId: "address",
                },
                {
                    amount: BigNumber.make(3),
                    recipientId: "address",
                },
            ]);
        });

        it("should throw if we want to add more payments than max authorized", () => {
            builder.data.asset!.payments = new Array(500);

            expect(() => builder.addPayment("address", "2")).toThrow(MaximumPaymentCountExceededError);
        });
    });
});
