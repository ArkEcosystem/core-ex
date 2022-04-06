export const Identifiers = {
	LogService: Symbol.for("Configuration<Logger>"),
	ConfigurationGenerator: Symbol.for("Configuration<Generator>"),
	DataPath: Symbol.for("Writer<DataPath>"),
	Generator: {
		App: Symbol.for("Generator<App>"),
		Environment: Symbol.for("Generator<Environment>"),
		GenesisBlock: Symbol.for("Generator<GenesisBlock>"),
		Milestones: Symbol.for("Generator<Milestones>"),
		Mnemonic: Symbol.for("Generator<Mnemonic>"),
		Network: Symbol.for("Generator<Network>"),
		Wallet: Symbol.for("Generator<Wallet>"),
	},
	NetworkWriter: Symbol.for("Writer<Network>"),
};
