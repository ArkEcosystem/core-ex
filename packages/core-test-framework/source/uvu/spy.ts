import { SinonSpy, spy } from "sinon";
import { ok } from "uvu/assert";

export class Spy {
	private readonly subject: SinonSpy;

	public constructor(target: object, method: string) {
		this.subject = spy(target, method as never);
	}

	public calledWith(...args: any[]): void {
		ok(this.subject.calledWith(...args));
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

		throw new Error(`Can't get args for call: ${index}`);
	}

	public restore(): void {
		this.subject.restore();
	}

	public reset(): void {
		this.subject.resetHistory();
	}
}
