export const Identifiers = {
	Application: Symbol.for("Configuration<Application>"),
	ConfigurationGenerator: Symbol.for("Configuration<Generator>"),
	ConfigurationPath: Symbol.for("Configuration<Path>"),
	Generator: {
		App: Symbol.for("Generator<App>"),
		Environment: Symbol.for("Generator<Environment>"),
		GenesisBlock: Symbol.for("Generator<GenesisBlock>"),
		Milestones: Symbol.for("Generator<Milestones>"),
		Mnemonic: Symbol.for("Generator<Mnemonic>"),
		Network: Symbol.for("Generator<Network>"),
		Wallet: Symbol.for("Generator<Wallet>"),
	},
	LogService: Symbol.for("Configuration<Logger>"),
	NetworkWriter: Symbol.for("Configuration<Writer>"),
};
