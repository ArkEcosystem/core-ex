import { Console } from "@arkecosystem/core-test-framework";
import { Table } from "@packages/core-cli/source/components";

let cli;
let component;

beforeEach(() => {
	cli = new Console();

	// Bind from src instead of dist to collect coverage.
	cli.app.rebind(Identifiers.Table).to(Table).inSingletonScope();
	component = cli.app.get(Identifiers.Table);
});

describe("Table", () => {
	it("should render the component", () => {
		let message: string;
		jest.spyOn(console, "log").mockImplementationOnce((m) => (message = m));

		component.render(["ID", "Name"], (table) => {
			table.push([1, "John Doe"], [2, "Jane Doe"]);
		});

		expect(message).toContain("ID");
		expect(message).toContain("Name");
		expect(message).toContain(1);
		expect(message).toContain("John Doe");
		expect(message).toContain(2);
		expect(message).toContain("Jane Doe");
	});
});
