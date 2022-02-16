import { Application, Container, Providers, Services } from "@arkecosystem/core-kernel";
import { ServiceProvider } from "./service-provider";
import { defaults } from "./defaults";
import { AnySchema } from "joi";
import { dirSync } from "tmp";
import { describe } from "@arkecosystem/core-test";

describe("ServiceProvider", ({ assert, afterAll, afterEach, beforeAll, beforeEach, it, nock, loader }) => {
    let app: Application;

    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        app = new Application(new Container.Container());
        app.bind(Container.Identifiers.ConfigFlags).toConstantValue("core");

        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register", async () => {
        app.bind<Services.Log.LogManager>(Container.Identifiers.LogManager)
            .to(Services.Log.LogManager)
            .inSingletonScope();

        await app.get<Services.Log.LogManager>(Container.Identifiers.LogManager).boot();

        serviceProvider.setConfig(app.resolve(Providers.PluginConfiguration).merge(defaults));

        app.bind(Container.Identifiers.ApplicationNamespace).toConstantValue("token-network");
        app.bind("path.log").toConstantValue(dirSync().name);

        await assert.resolves(() => serviceProvider.register());
    });

    it("should be disposable", async () => {
        app.bind<Services.Log.LogManager>(Container.Identifiers.LogManager)
            .to(Services.Log.LogManager)
            .inSingletonScope();

        await app.get<Services.Log.LogManager>(Container.Identifiers.LogManager).boot();

        serviceProvider.setConfig(app.resolve(Providers.PluginConfiguration).merge(defaults));

        app.bind(Container.Identifiers.ApplicationNamespace).toConstantValue("token-network");
        app.bind("path.log").toConstantValue(dirSync().name);

        app.bind(Container.Identifiers.LogService).toDynamicValue((context: Container.interfaces.Context) =>
            context.container.get<Services.Log.LogManager>(Container.Identifiers.LogManager).driver(),
        );

        await assert.resolves(() => serviceProvider.register());

        await assert.resolves(() => serviceProvider.dispose());
    });

    describe("ServiceProvider.configSchema", () => {
        let serviceProvider: ServiceProvider;

        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            for (const key of Object.keys(process.env)) {
                if (key.includes("CORE_LOG_LEVEL")) {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                defaults
            );

            assert.undefined(result.error);

            assert.string(result.value.levels.console);
            assert.string(result.value.levels.file);

            assert.string(result.value.fileRotator.interval);
        });

        it("should allow configuration extension", async () => {
            const defaults = (await import("./defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            assert.undefined(result.error);
            assert.equal(result.value.customField, "dummy");
        });

        describe("process.env.CORE_LOG_LEVEL", () => {
            it("should return value of process.env.CORE_LOG_LEVEL if defined", async () => {
                process.env.CORE_LOG_LEVEL = "dummy";

                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("./defaults")).defaults,
                );

                assert.undefined(result.error);
                assert.equal(result.value.levels.console, "dummy");
            });
        });

        describe("process.env.CORE_LOG_LEVEL_FILE", () => {
            it("should return value of process.env.CORE_LOG_LEVEL_FILE if defined", async () => {
                process.env.CORE_LOG_LEVEL_FILE = "dummy";

                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("./defaults")).defaults,
                );

                assert.undefined(result.error);
                assert.equal(result.value.levels.file, "dummy");
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                defaults = (await import("./defaults")).defaults;
            });

            it("levels is required && is object", async () => {
                defaults.levels = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);


                assert.equal(result.error!.message, '"levels" must be of type object');

                delete defaults.levels;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                assert.equal(result.error!.message, '"levels" is required');
            });

            it("levels.console is required && is string", async () => {
                defaults.levels.console = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                assert.equal(result.error!.message, '"levels.console" must be a string');

                delete defaults.levels.console;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                assert.equal(result.error!.message, '"levels.console" is required');
            });

            it("levels.file is required && is string", async () => {
                defaults.levels.file = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                assert.equal(result.error!.message, '"levels.file" must be a string');

                delete defaults.levels.file;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                assert.equal(result.error!.message, '"levels.file" is required');
            });

            it("fileRotator is required && is object", async () => {
                defaults.fileRotator = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                assert.equal(result.error!.message, '"fileRotator" must be of type object');

                delete defaults.fileRotator;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                assert.equal(result.error!.message, '"fileRotator" is required');
            });

            it("fileRotator.interval is required && is string", async () => {
                defaults.fileRotator.interval = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                assert.equal(result.error!.message, '"fileRotator.interval" must be a string');

                delete defaults.fileRotator.interval;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                assert.equal(result.error!.message, '"fileRotator.interval" is required');
            });
        });
    });
});
