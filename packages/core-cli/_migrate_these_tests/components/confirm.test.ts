import "jest-extended";

import { Container } from "@packages/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Confirm } from "@packages/core-cli/source/components";
import prompts from "prompts";

let cli;
let component;

beforeEach(() => {
	cli = new Console();

	// Bind from src instead of dist to collect coverage.
	cli.app.rebind(Identifiers.Confirm).to(Confirm).inSingletonScope();
	component = cli.app.get(Identifiers.Confirm);
});

describe("Confirm", () => {
	it("should render the component", async () => {
		prompts.inject([true]);

		await expect(component.render("Hello World")).resolves.toBeTrue();
	});
});
