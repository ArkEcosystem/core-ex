import { Console } from "@arkecosystem/core-test-framework";
import { Error } from "@packages/core-cli/source/components";
import { white } from "kleur";

let cli;
let component;

beforeEach(() => {
	cli = new Console();

	// Bind from src instead of dist to collect coverage.
	cli.app.rebind(Identifiers.Error).to(Error).inSingletonScope();
	component = cli.app.get(Identifiers.Error);
});

describe("Error", () => {
	it("should render the component", () => {
		const spyLogger = jest.spyOn(cli.app.get(Identifiers.Logger), "error");

		component.render("Hello World");

		expect(spyLogger).toHaveBeenCalledWith(white().bgRed(`[ERROR] Hello World`));
	});
});
