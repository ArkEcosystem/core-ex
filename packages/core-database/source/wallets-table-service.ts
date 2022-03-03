import Contracts, { Identifiers } from "@arkecosystem/core-contracts";
import { inject, injectable } from "@arkecosystem/core-container";
import { Connection } from "typeorm";

@injectable()
export class WalletsTableService implements Contracts.Database.WalletsTableService {
	@inject(Identifiers.DatabaseConnection)
	private readonly connection!: Connection;

	public async flush(): Promise<void> {
		const queryRunner = this.connection.createQueryRunner();

		try {
			await queryRunner.startTransaction("SERIALIZABLE");

			try {
				await queryRunner.query(`TRUNCATE TABLE wallets`);
				await queryRunner.commitTransaction();
			} catch (error) {
				await queryRunner.rollbackTransaction();
				throw error;
			}
		} finally {
			await queryRunner.release();
		}
	}

	public async sync(wallets: readonly Contracts.State.Wallet[]): Promise<void> {
		// 30000 parameters per query / 5 params per wallet (address, publicKey, balance, nonce, attributes)
		const batchSize = 6000;

		const queryRunner = this.connection.createQueryRunner();

		try {
			await queryRunner.startTransaction("SERIALIZABLE");

			try {
				for (let index = 0; index < wallets.length; index += batchSize) {
					const batchWallets = wallets.slice(index, index + batchSize);

					const parameters = batchWallets.flatMap((w) => [
						w.getAddress(),
						w.getPublicKey(),
						w.getBalance().toFixed(),
						w.getNonce().toFixed(),
						w.getAttributes(),
					]);

					const values = batchWallets
						.map((_, y) => `($${y * 5 + 1}, $${y * 5 + 2}, $${y * 5 + 3}, $${y * 5 + 4}, $${y * 5 + 5})`)
						.join(", ");

					const query = `
                        INSERT INTO wallets(address, public_key, balance, nonce, attributes) VALUES
                            ${values}
                        ON CONFLICT (address) DO UPDATE SET
                            public_key = EXCLUDED.public_key,
                            balance = EXCLUDED.balance,
                            nonce = EXCLUDED.nonce,
                            attributes = EXCLUDED.attributes
                    `;

					await queryRunner.query(query, parameters);
				}

				await queryRunner.commitTransaction();
			} catch (error) {
				await queryRunner.rollbackTransaction();
				throw error;
			}
		} finally {
			await queryRunner.release();
		}
	}
}
