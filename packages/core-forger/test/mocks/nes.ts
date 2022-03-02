import sinon from "sinon";

export const nesClient = {
	connect: sinon.stub().returns(new Promise<void>((resolve) => resolve())),
	disconnect: sinon.spy(),
	request: sinon.stub().returns({ payload: Buffer.from(JSON.stringify({})) }),
	onError: sinon.spy(),
	_isReady: sinon.stub().returns(true),
	setMaxPayload: sinon.spy(),
};

export default {
	Client: sinon.stub().callsFake(() => nesClient),
};
