import { TransactionBuilderFactory } from "./builder-factory";
import { ConfigManager } from "./config";
import { NetworkConfig } from "./contracts";
import { TransactionDeserializer } from "./deserializer";
import { TransactionFactory } from "./factory";
import { Helpers } from "./helpers";
import { TransactionRegistry } from "./registry";
import { TransactionSerializer } from "./serializer";
import { TransactionSigner } from "./signer";
import { TransactionTypeFactory } from "./types";
import { TransactionValidator } from "./validator";
import { TransactionVerifier } from "./verifier";

export class TransactionManager {
    readonly #builderFactory: TransactionBuilderFactory;
    readonly #config: ConfigManager;
    readonly #deserializer: TransactionDeserializer;
    readonly #factory: TransactionFactory;
    readonly #helpers: Helpers;
    readonly #registry: TransactionRegistry;
    readonly #serializer: TransactionSerializer;
    readonly #signer: TransactionSigner;
    readonly #validator: TransactionValidator;
    readonly #verifier: TransactionVerifier;
    readonly #transactionTypeFactory: TransactionTypeFactory;

    public constructor(network: NetworkConfig) {
        this.#config = new ConfigManager(network);

        this.#transactionTypeFactory = new TransactionTypeFactory(this.#config);

        // FIX: TransactionTypeFactory depends on TransactionVerifier and vica versa
        this.#verifier = new TransactionVerifier(this.#config, this.#transactionTypeFactory);

        this.#transactionTypeFactory.setVerifier(this.#verifier);

        this.#serializer = new TransactionSerializer(this.#config, this.#verifier, this.#transactionTypeFactory);

        this.#deserializer = new TransactionDeserializer(this.#config, this.#verifier, this.#transactionTypeFactory);

        this.#helpers = new Helpers(this.#config, this.#serializer, this.#transactionTypeFactory);

        this.#validator = new TransactionValidator(this.#config);

        this.#verifier.initialize(this.#helpers, this.#validator);

        this.#factory = new TransactionFactory(
            this.#config,
            this.#helpers,
            this.#deserializer,
            this.#serializer,
            this.#verifier,
            this.#transactionTypeFactory,
        );

        this.#signer = new TransactionSigner(this.#helpers);

        this.#builderFactory = new TransactionBuilderFactory({
            config: this.config,
            factory: this.#factory,
            signer: this.#signer,
            verifier: this.#verifier,
            helpers: this.#helpers,
        });

        this.#registry = new TransactionRegistry(this.#validator, this.#transactionTypeFactory);
    }

    public config(): ConfigManager {
        return this.#config;
    }

    public helpers(): Helpers {
        return this.#helpers;
    }

    public builderFactory(): TransactionBuilderFactory {
        return this.#builderFactory;
    }

    public deserializer(): TransactionDeserializer {
        return this.#deserializer;
    }

    public factory(): TransactionFactory {
        return this.#factory;
    }

    public serializer(): TransactionSerializer {
        return this.#serializer;
    }

    public signer(): TransactionSigner {
        return this.#signer;
    }

    public verifier(): TransactionVerifier {
        return this.#verifier;
    }

    public validator(): TransactionValidator {
        return this.#validator;
    }

    public registry(): TransactionRegistry {
        return this.#registry;
    }
}
