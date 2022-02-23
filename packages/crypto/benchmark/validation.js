const { Validator } = require("../distribution/validation");

const iterations = 10000000;
const validator = Validator.make();

const times = (iterations, callback) => {
	for (let index = 0; index < iterations; index++) {
		callback();
	}
};

exports["ajv.alphanumeric"] = () => {
	times(iterations, () => validator.validate("alphanumeric", "123456789"));
};

exports["ajv.address"] = () => {
	times(iterations, () =>
		validator.validate("address", [
			"123456789ABCDEFGHJKLMNPQRSTUVWXYZa",
			"123456789ABCDEFGHJKLMNPQRSTUVWXYZa",
			"123456789ABCDEFGHJKLMNPQRSTUVWXYZa",
		]),
	);
};
