export const Identifiers = {
	Application: Symbol.for("Application"),
	ApplicationPaths: Symbol.for("Paths<Application>"),
	Commands: Symbol.for("Commands"),
	Config: Symbol.for("Config"),
	ConsolePaths: Symbol.for("Paths<Console>"),
	Environment: Symbol.for("Environment"),
	// Factories
ActionFactory: Symbol.for("Factory<Action>"),
	

Input: Symbol.for("Input"),
	


ComponentFactory: Symbol.for("Factory<Component>"),
	

// Input
InputValidator: Symbol.for("Input<Validator>"),
	

// Actions
AbortMissingProcess: Symbol.for("Action<AbortMissingProcess>"),
	


Installer: Symbol.for("Installer"),
	


AbortErroredProcess: Symbol.for("Action<AbortErroredProcess>"),
	


Logger: Symbol.for("Logger"),
	
	

AbortRunningProcess: Symbol.for("Action<AbortRunningProcess>"),
	
	
Output: Symbol.for("Output"),
	
AbortStoppedProcess: Symbol.for("Action<AbortStoppedProcess>"),
	
Package: Symbol.for("Package"),
	
AbortUnknownProcess: Symbol.for("Action<AbortUnknownProcess>"),
	
	PluginManager: Symbol.for("PluginManager"),
	// Components
AppHeader: Symbol.for("Component<AppHeader>"),
	
ProcessManager: Symbol.for("ProcessManager"),
	
Ask: Symbol.for("Component<Ask>"),
	
Updater: Symbol.for("Updater"),
	
AskDate: Symbol.for("Component<AskDate>"),
	
AskHidden: Symbol.for("Component<AskHidden>"),
	
InputFactory: Symbol.for("Factory<Input>"),
	
AskNumber: Symbol.for("Component<AskNumber>"),
	
	ProcessFactory: Symbol.for("Factory<Process>"),
	AskPassword: Symbol.for("Component<AskPassword>"),
	DaemonizeProcess: Symbol.for("Action<DaemonizeProcess>"),
	AutoComplete: Symbol.for("Component<AutoComplete>"),
	RestartProcess: Symbol.for("Action<RestartProcess>"),
	Box: Symbol.for("Component<Box>"),
	RestartRunningProcess: Symbol.for("Action<RestartRunningProcess>"),
	Clear: Symbol.for("Component<Clear>"),
	RestartRunningProcessWithPrompt: Symbol.for("Action<RestartRunningProcessWithPrompt>"),
	Confirm: Symbol.for("Component<Confirm>"),
	Error: Symbol.for("Component<Error>"),
	Fatal: Symbol.for("Component<Fatal>"),
	Info: Symbol.for("Component<Info>"),
	Listing: Symbol.for("Component<Listing>"),
	Log: Symbol.for("Component<Log>"),
	MultiSelect: Symbol.for("Component<MultiSelect>"),
	NewLine: Symbol.for("Component<NewLine>"),
	Prompt: Symbol.for("Component<Prompt>"),
	Select: Symbol.for("Component<Select>"),
	Spinner: Symbol.for("Component<Spinner>"),
	Success: Symbol.for("Component<Success>"),
	Table: Symbol.for("Component<Table>"),
	TaskList: Symbol.for("Component<TaskList>"),
	Title: Symbol.for("Component<Title>"),
	Toggle: Symbol.for("Component<Toggle>"),
	Warning: Symbol.for("Component<Warning>"),
};
