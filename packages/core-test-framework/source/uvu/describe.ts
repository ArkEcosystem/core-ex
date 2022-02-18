import { SinonSpyStatic, spy } from "sinon";
import { Callback, Context, suite, Test } from "uvu";
import { z as schema } from "zod";

import { assert } from "./assert";
import { each, formatName } from "./each";
import { runHook } from "./hooks";
import { loader } from "./loader";
import { nock } from "./nock";
import { Stub } from "./stub";

type ContextFunction<T> = () => T;
type ContextCallback<T> = (context: T) => Promise<void> | void;

interface CallbackArguments<T> {
	afterAll: (callback_: ContextCallback<T>) => void;
	afterEach: (callback_: ContextCallback<T>) => void;
	assert: typeof assert;
	beforeAll: (callback_: ContextCallback<T>) => void;
	beforeEach: (callback_: ContextCallback<T>) => void;
	dataset: unknown;
	each: (name: string, callback: Callback<any>, datasets: unknown[]) => void;
	it: Test<T>;
	loader: typeof loader;
	nock: typeof nock;
	only: Function;
	schema: typeof schema;
	skip: Function;
	spy: SinonSpyStatic;
	stub: (owner: object, method: string) => Stub;
}

type CallbackFunction<T> = (arguments_: CallbackArguments<T>) => void;

const runSuite = <T = Context>(suite: Test<T>, callback: CallbackFunction<T>, dataset?: unknown): void => {
	let stubs: Stub[] = [];

	suite.before(() => {
		nock.disableNetConnect();
	});

	suite.after(() => {
		nock.enableNetConnect();
	});

	suite.after.each(() => {
		nock.cleanAll();

		for (const stub of stubs) {
			stub.restore();
		}

		stubs = [];
	});

	callback({
		afterAll: async (callback_: ContextCallback<T>) => suite.after(runHook(callback_)),
		afterEach: async (callback_: ContextCallback<T>) => suite.after.each(runHook(callback_)),
		assert,
		beforeAll: async (callback_: ContextCallback<T>) => suite.before(runHook(callback_)),
		beforeEach: async (callback_: ContextCallback<T>) => suite.before.each(runHook(callback_)),
		dataset,
		each: each(suite),
		it: suite,
		loader,
		nock,
		only: suite.only,
		schema,
		skip: suite.skip,
		spy,
		stub: (owner: object, method: string) => {
			const result: Stub = new Stub(owner, method);

			stubs.push(result);

			return result;
		},
	});

	suite.run();
};

export const describe = <T = Context>(title: string, callback: CallbackFunction<T>): void =>
	runSuite<T>(suite<T>(title), callback);

export const describeWithContext = <T = Context>(
	title: string,
	context: Context | ContextFunction<T>,
	callback: CallbackFunction<T>,
): void => runSuite(suite(title, typeof context === "function" ? context() : context), callback);

export const describeEach = <T = Context>(title: string, callback: CallbackFunction<T>, datasets: unknown[]): void => {
	for (const dataset of datasets) {
		runSuite(suite(formatName(title, dataset)), callback);
	}
};
