import { ok } from "uvu/assert";

export class Fake<T> {
	protected subject;

	public calledWith(...arguments_: any[]): void {
		ok(this.subject.calledWith(...arguments_));
	}

	public calledOnce(): void {
		this.calledTimes(1);
	}

	public calledTimes(times: number): void {
		ok(this.subject.callCount === times);
	}

	public neverCalled(): void {
		this.calledTimes(0);
	}

	public getCallArgs(index: number): any[] {
		if (this.subject.callCount > index) {
			return this.subject.getCall(index).args;
		}

		throw new Error(`Failed to get arguments for call#${index}`);
	}

	public restore(): void {
		this.subject.restore();
	}

	public reset(): void {
		this.subject.resetHistory();
	}
}
