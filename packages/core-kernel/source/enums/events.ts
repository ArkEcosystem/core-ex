export enum KernelEvent {
	Booted = "kernel.booted",
	Booting = "kernel.booting",
	Bootstrapped = "kernel.bootstrapper.bootstrapped",
	Bootstrapping = "kernel.bootstrapper.bootstrapping",
	ServiceProviderBooted = "kernel.serviceProvider.booted",
	ServiceProviderDisposed = "kernel.serviceProvider.disposed",
	ServiceProviderRegistered = "kernel.serviceProvider.registered",
}

export enum CacheEvent {
	Flushed = "cache.flushed",
	Forgotten = "cache.forgotten",
	Hit = "cache.hit",
	Missed = "cache.missed",
	Written = "cache.written",
}

export enum CryptoEvent {
	MilestoneChanged = "crypto.milestone.changed",
}

export enum BlockEvent {
	Applied = "block.applied",
	Disregarded = "block.disregarded",
	Forged = "block.forged",
	Received = "block.received",
	Reverted = "block.reverted",
}

export enum ValidatorEvent {
	Registered = "validator.registered",
	Resigned = "validator.resigned",
}

export enum VoteEvent {
	Vote = "wallet.vote",
	Unvote = "wallet.unvote",
}

export enum ForgerEvent {
	Failed = "forger.failed",
	Missing = "forger.missing",
	Started = "forger.started",
}

export enum PeerEvent {
	Added = "peer.added",
	Disconnect = "peer.disconnect",
	Disconnected = "peer.disconnected",
	Disconnecting = "peer.disconnecting",
	Removed = "peer.removed",
}

export enum RoundEvent {
	Applied = "round.applied",
	Created = "round.created",
	Missed = "round.missed",
}

export enum StateEvent {
	BuilderFinished = "state.builder.finished",
	Started = "state.started",
	Starting = "state.starting",
}

export enum TransactionEvent {
	AddedToPool = "transaction.pool.added",
	Applied = "transaction.applied",
	Expired = "transaction.expired",
	Forged = "transaction.forged",
	RejectedByPool = "transaction.pool.rejected",
	RemovedFromPool = "transaction.pool.removed",
	Reverted = "transaction.reverted",
}

export enum ScheduleEvent {
	BlockJobFinished = "schedule.blockJob.finished",
	CronJobFinished = "schedule.cronJob.finished",
}

export enum QueueEvent {
	Finished = "queue.finished",
	Failed = "queue.failed",
}
