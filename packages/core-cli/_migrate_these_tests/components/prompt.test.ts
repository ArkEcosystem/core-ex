import { Container } from "@packages/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Prompt } from "@packages/core-cli/source/components";
import prompts from "prompts";

let cli;
let component;

beforeEach(() => {
	cli = new Console();

	// Bind from src instead of dist to collect coverage.
	cli.app.rebind(Identifiers.Prompt).to(Prompt).inSingletonScope();
	component = cli.app.get(Identifiers.Prompt);
});

describe("Prompt", () => {
	it("should render the component", async () => {
		prompts.inject(["johndoe"]);

		await expect(
			component.render({
				type: "text",
				name: "value",
				message: "What's your twitter handle?",
			}),
		).resolves.toEqual({ value: "johndoe" });
	});
});
