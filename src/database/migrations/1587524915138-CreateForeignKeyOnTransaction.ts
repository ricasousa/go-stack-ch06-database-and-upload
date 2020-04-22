import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export default class CreateForeignKeyOnTransaction1587524915138
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const providerIdForeignKey = new TableForeignKey({
      columnNames: ['category_id'],
      referencedTableName: 'categories',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    providerIdForeignKey.name = 'TransactionsCategoryIdForeignKey';

    await queryRunner.createForeignKey('transactions', providerIdForeignKey);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'transactions',
      'TransactionsCategoryIdForeignKey',
    );
  }
}
