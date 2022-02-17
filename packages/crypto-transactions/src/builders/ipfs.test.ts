import "jest-extended";

import { BigNumber } from "@arkecosystem/utils";

import { createServices } from "../../test";
import { TransactionBuilderFactory } from "../builder-factory";
import { ConfigManager } from "../config";
import { TransactionType } from "../enums";
import { Helpers } from "../helpers";
import { InternalTransactionType } from "../types";
import { IpfsTransaction } from "../types/two";
import { IPFSBuilder } from "./ipfs";

let builder: IPFSBuilder;
let configManager: ConfigManager;
let builderFactory: TransactionBuilderFactory;

beforeEach(() => {
    const typesMap = new Map();
    const internalType: InternalTransactionType = InternalTransactionType.from(
        IpfsTransaction.type,
        IpfsTransaction.typeGroup,
    );
    typesMap.set(internalType, new Map().set(IpfsTransaction.version, IpfsTransaction));

    const services = createServices("testnet");
    services.transactionTypeFactory.setTypes(typesMap);
    configManager = services.config;
    configManager.setHeight(2); // v2 transactions
    builderFactory = services.builderFactory;
});

describe("IPFS Transaction", () => {
    beforeEach(() => {
        builder = builderFactory.ipfs();
    });

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.Ipfs);
        //expect(builder).toHaveProperty("data.fee", Two.IpfsTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", BigNumber.make(0));
        expect(builder).toHaveProperty("data.asset", {});
    });

    it("establishes the IPFS asset", () => {
        builder.ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w");
        expect(builder.data.asset!.ipfs).toBe("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w");
    });
});
