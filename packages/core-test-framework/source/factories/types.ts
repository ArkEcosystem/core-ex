export type FactoryFunctionOptions = Record<string, any>;

export type FactoryFunction = ({ entity, options }: { entity?: any; options: FactoryFunctionOptions }) => Promise<any>;

export type HookFunction = ({ entity, options }: { entity?: any; options: FactoryFunctionOptions }) => void;
