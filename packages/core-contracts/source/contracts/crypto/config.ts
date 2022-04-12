import { Milestone, MilestoneSearchResult, NetworkConfig, NetworkConfigPartial } from "./networks";

export interface IConfiguration {
	setConfig(config: NetworkConfigPartial): void;

	all(): NetworkConfig | undefined;

	set<T = any>(key: string, value: T): void;

	get<T = any>(key: string): T;

	setHeight(value: number): void;

	getHeight(): number | undefined;

	isNewMilestone(height?: number): boolean;

	getMilestone(height?: number): Milestone;

	getNextMilestoneWithNewKey(previousMilestone: number, key: string): MilestoneSearchResult;

	getMilestones(): any;
}
