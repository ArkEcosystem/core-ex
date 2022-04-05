const flagNames = [
	"CORE_LOG_LEVEL",
	"CORE_LOG_LEVEL_FILE",
	"CORE_DB_HOST",
	"CORE_DB_PORT",
	"CORE_DB_DATABASE",
	"CORE_DB_USERNAME",
	"CORE_P2P_HOST",
	"CORE_P2P_PORT",
	"CORE_WEBHOOKS_HOST",
	"CORE_WEBHOOKS_PORT",
	"CORE_API_HOST",
	"CORE_API_PORT",
] as const;

export type Flag = typeof flagNames[number];
