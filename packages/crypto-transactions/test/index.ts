import * as networks from "./networks";
import { ConfigManager } from "../src/config";
import { Helpers } from "../src/helpers";
import { TransactionBuilderFactory } from "../src/builder-factory";
import { TransactionDeserializer } from "../src/deserializer";
import { TransactionFactory } from "../src/factory";
import { TransactionRegistry } from "../src/registry";
import { TransactionSerializer } from "../src/serializer";
import { TransactionSigner } from "../src/signer";
import { TransactionTypeFactory } from "../src/types";
import { TransactionValidator } from "../src/validator";
import { TransactionVerifier } from "../src/verifier";

export const createConfig = (network: string, options?: Record<string, unknown>): ConfigManager => {
    const instance = new ConfigManager(networks[network]);

    if (options) {
        for (const [key, value] of Object.entries(options)) {
            instance.set(key, value);
        }
    }

    //@ts-ignore
    instance.buildConstants();

    return instance;
};

export const createServices = (network: string, options?: Record<string, unknown>) => {
    const config = createConfig(network, options);
    const transactionTypeFactory = new TransactionTypeFactory(config);
    const verifier = new TransactionVerifier(config, transactionTypeFactory);
    transactionTypeFactory.setVerifier(verifier);
    const serializer = new TransactionSerializer(config, verifier, transactionTypeFactory);
    const deserializer = new TransactionDeserializer(config, verifier, transactionTypeFactory);
    const helpers = new Helpers(config, serializer, transactionTypeFactory);
    const validator = new TransactionValidator(config);
    verifier.initialize(helpers, validator);
    const factory = new TransactionFactory(config, helpers, deserializer, serializer, verifier, transactionTypeFactory);
    const signer = new TransactionSigner(helpers);
    const builderFactory = new TransactionBuilderFactory({
        config: config,
        factory: factory,
        signer: signer,
        verifier: verifier,
        helpers: helpers,
    });
    const registry = new TransactionRegistry(validator, transactionTypeFactory);

    return {
        builderFactory,
        config,
        deserializer,
        factory,
        helpers,
        registry,
        serializer,
        signer,
        transactionTypeFactory,
        validator,
        verifier,
    };
};
