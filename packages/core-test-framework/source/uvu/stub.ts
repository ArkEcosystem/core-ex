import { SinonStub, stub } from "sinon";

import { Fake } from "./fake";

export class Stub extends Fake<SinonStub> {
	public constructor(target: object, method: string) {
		super();

		this.subject = stub(target, method as never);
	}

	public returnValue(value: unknown): Stub {
		this.subject.returns(value);

		return this;
	}

	public returnValueOnce(value: unknown): Stub {
		this.subject.onFirstCall().returns(value);

		return this;
	}

	public returnValueNth(nth: number, value: unknown): Stub {
		this.subject.onCall(nth).returns(value);

		return this;
	}

	public resolvedValue(value: unknown): Stub {
		this.subject.resolves(value);

		return this;
	}

	public resolvedValueNth(nth: number, value: unknown): Stub {
        this.subject.onCall(nth).resolves(value);

        return this;
    }

	public rejectedValue(value: unknown): Stub {
		this.subject.rejects(value);

		return this;
	}

	public rejectedValueNth(nth: number, value: unknown): Stub {
        this.subject.onCall(nth).rejects(value);

        return this;
    }

	public callsFake(value: (...arguments_: any[]) => any): Stub {
		this.subject.callsFake(value);

		return this;
	}
}
