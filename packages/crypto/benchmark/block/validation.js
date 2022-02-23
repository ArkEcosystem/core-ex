const { Validator } = require("../../distribution/validation");

const prepareData = (data) => {
	const bigNumbers = new Set(["fee", "amount", "nonce"]);

	for (const [key, value] of Object.entries(data)) {
		if (bigNumbers.has(key)) {
			data[key] = new Utils.BigNumber(value);
		}
	}

	return data;
};

const data = prepareData(require("../helpers").getJSONFixture("block/deserialized/no-transactions"));

exports["ajv.blocks"] = () => {
	const validator = Validator.make();
	
	for (let index = 0; index < 10000; index++) {
		validator.validate("block", data);
	}
};
