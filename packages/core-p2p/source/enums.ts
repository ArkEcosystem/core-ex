export enum Severity {
	DEBUG_EXTRA,

	/** One such message per successful peer verification is printed. */
	DEBUG,

	/** Failures to verify peer state, either designating malicious peer or communication issues. */
	INFO,
}

export enum NetworkStateStatus {
	Default,
	BelowMinimumPeers,
	Test,
	ColdStart,
	Unknown,
}

export enum SocketErrors {
	Timeout = "CoreTimeoutError",
	SocketNotOpen = "CoreSocketNotOpenError",
	Validation = "CoreValidationError",
}
