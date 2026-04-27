import { TableIndex, type QueryRunner } from 'typeorm';
import type { MigrationInterface } from 'typeorm';

export class AddUniqueIndexesRecords1761200000000 implements MigrationInterface {
  name = 'AddUniqueIndexesRecords1761200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const partialWhereClause = '"deletedAt" IS NULL';

    const indexesToCreate = [
      new TableIndex({
        name: 'IDX_records_plates_unique',
        columnNames: ['plates'],
        isUnique: true,
        where: partialWhereClause,
      }),
      new TableIndex({
        name: 'IDX_records_engine_number_unique',
        columnNames: ['engineNumber'],
        isUnique: true,
        where: partialWhereClause,
      }),
      new TableIndex({
        name: 'IDX_records_serial_number_unique',
        columnNames: ['serialNumber'],
        isUnique: true,
        where: partialWhereClause,
      }),
    ];

    const table = await queryRunner.getTable('records');

    for (const index of indexesToCreate) {
      const exists = table?.indices.some((idx) => idx.name === index.name);

      if (!exists) {
        await queryRunner.createIndex('records', index);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('records', 'IDX_records_serial_number_unique');
    await queryRunner.dropIndex('records', 'IDX_records_engine_number_unique');
    await queryRunner.dropIndex('records', 'IDX_records_plates_unique');
  }
}
