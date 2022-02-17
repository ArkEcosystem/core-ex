import { Container } from "@packages/core-kernel";

import { TransactionsRoute } from "@packages/core-p2p/source/socket-server/routes/transactions";

describe("BlocksRoute", () => {
	let tranasctionsRoute: TransactionsRoute;

	const container = new Container.Container();

	const logger = { warning: jest.fn(), debug: jest.fn() };
	const controller = { getPeers: jest.fn() }; // a mock peer controller
	const app = {
		resolve: jest.fn().mockReturnValue(controller),
		getTagged: () => ({
			getOptional: jest.fn().mockReturnValue(40),
		}),
	};
	const server = { bind: jest.fn(), route: jest.fn() };

	beforeAll(() => {
		container.unbindAll();
		container.bind(Container.Identifiers.LogService).toConstantValue(logger);
		container.bind(Container.Identifiers.Application).toConstantValue(app);
	});

	beforeEach(() => {
		tranasctionsRoute = container.resolve<TransactionsRoute>(TransactionsRoute);
	});

	it("should bind the controller to the server and register the routes", () => {
		const routes = tranasctionsRoute.getRoutesConfigByPath();
		const routesExpected = Object.entries(routes).map(([path, config]) => ({
			method: "POST",
			path,
			config: {
				id: config.id,
				handler: config.handler,
				payload: {
					maxBytes: config.maxBytes,
				},
				isInternal: true,
			},
		}));

		tranasctionsRoute.register(server);

		expect(server.bind).toBeCalledTimes(1);
		expect(server.bind).toBeCalledWith(controller);

		expect(server.route).toBeCalledTimes(routesExpected.length);
		for (const route of routesExpected) {
			expect(server.route).toBeCalledWith(route);
		}
	});
});
