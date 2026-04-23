import {
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
  type QueryRunner,
} from 'typeorm';
import type { MigrationInterface } from 'typeorm';

const USER_ROLE_ENUM = 'users_role_enum';

async function ensureColumn(
  queryRunner: QueryRunner,
  tableName: string,
  column: TableColumn,
) {
  const hasColumn = await queryRunner.hasColumn(tableName, column.name);

  if (!hasColumn) {
    await queryRunner.addColumn(tableName, column);
  }
}

async function ensureIndex(
  queryRunner: QueryRunner,
  tableName: string,
  index: TableIndex,
) {
  const table = await queryRunner.getTable(tableName);
  const hasIndex = table?.indices.some((existingIndex) => existingIndex.name === index.name);

  if (!hasIndex) {
    await queryRunner.createIndex(tableName, index);
  }
}

async function ensureForeignKey(
  queryRunner: QueryRunner,
  tableName: string,
  foreignKey: TableForeignKey,
) {
  const table = await queryRunner.getTable(tableName);
  const hasForeignKey = table?.foreignKeys.some(
    (existingForeignKey) => existingForeignKey.name === foreignKey.name,
  );

  if (!hasForeignKey) {
    await queryRunner.createForeignKey(tableName, foreignKey);
  }
}

export class InitSchema1761140000000 implements MigrationInterface {
  name = 'InitSchema1761140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = '${USER_ROLE_ENUM}' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."${USER_ROLE_ENUM}" AS ENUM('capturist', 'regional_manager', 'admin', 'director', 'superadmin');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = '${USER_ROLE_ENUM}' AND n.nspname = 'public'
        ) AND NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = '${USER_ROLE_ENUM}'
            AND e.enumlabel = 'director'
        ) THEN
          ALTER TYPE "public"."${USER_ROLE_ENUM}" ADD VALUE 'director';
        END IF;
      END $$;
    `);

    const hasRegionsTable = await queryRunner.hasTable('regions');
    if (!hasRegionsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'regions',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            { name: 'createdAt', type: 'timestamp', default: 'now()' },
            { name: 'updatedAt', type: 'timestamp', default: 'now()' },
            { name: 'deletedAt', type: 'timestamp', isNullable: true },
            { name: 'name', type: 'varchar', isUnique: true },
            { name: 'code', type: 'varchar', isUnique: true },
            { name: 'sortOrder', type: 'int', default: 0 },
          ],
        }),
      );
    }

    const hasDelegationsTable = await queryRunner.hasTable('delegations');
    if (!hasDelegationsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'delegations',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            { name: 'createdAt', type: 'timestamp', default: 'now()' },
            { name: 'updatedAt', type: 'timestamp', default: 'now()' },
            { name: 'deletedAt', type: 'timestamp', isNullable: true },
            { name: 'name', type: 'varchar' },
            { name: 'sortOrder', type: 'int', default: 0 },
            { name: 'regionId', type: 'uuid' },
          ],
        }),
      );
    }

    const hasUsersTable = await queryRunner.hasTable('users');
    if (!hasUsersTable) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            { name: 'createdAt', type: 'timestamp', default: 'now()' },
            { name: 'updatedAt', type: 'timestamp', default: 'now()' },
            { name: 'deletedAt', type: 'timestamp', isNullable: true },
            { name: 'firstName', type: 'varchar' },
            { name: 'lastName', type: 'varchar' },
            { name: 'grade', type: 'varchar' },
            { name: 'phone', type: 'varchar' },
            { name: 'email', type: 'varchar', isUnique: true },
            { name: 'passwordHash', type: 'varchar' },
            { name: 'role', type: 'enum', enumName: USER_ROLE_ENUM, enum: ['capturist', 'regional_manager', 'admin', 'director', 'superadmin'] },
            { name: 'isActive', type: 'boolean', default: true },
            { name: 'regionId', type: 'uuid', isNullable: true },
            { name: 'delegationId', type: 'uuid', isNullable: true },
          ],
        }),
      );
    }

    const hasRecordsTable = await queryRunner.hasTable('records');
    if (!hasRecordsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'records',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            { name: 'createdAt', type: 'timestamp', default: 'now()' },
            { name: 'updatedAt', type: 'timestamp', default: 'now()' },
            { name: 'deletedAt', type: 'timestamp', isNullable: true },
            { name: 'plates', type: 'varchar' },
            { name: 'brand', type: 'varchar' },
            { name: 'type', type: 'varchar' },
            { name: 'useType', type: 'varchar' },
            { name: 'vehicleClass', type: 'varchar' },
            { name: 'model', type: 'varchar' },
            { name: 'engineNumber', type: 'varchar' },
            { name: 'serialNumber', type: 'varchar' },
            { name: 'custodian', type: 'varchar' },
            { name: 'patrolNumber', type: 'varchar' },
            { name: 'physicalStatus', type: 'varchar' },
            { name: 'status', type: 'varchar' },
            { name: 'assetClassification', type: 'varchar' },
            { name: 'observation', type: 'text', default: "''" },
            { name: 'delegationId', type: 'uuid' },
            { name: 'createdById', type: 'uuid' },
          ],
        }),
      );
    }

    const hasAuditLogsTable = await queryRunner.hasTable('audit_logs');
    if (!hasAuditLogsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'audit_logs',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            { name: 'createdAt', type: 'timestamp', default: 'now()' },
            { name: 'updatedAt', type: 'timestamp', default: 'now()' },
            { name: 'deletedAt', type: 'timestamp', isNullable: true },
            { name: 'action', type: 'varchar' },
            { name: 'entityType', type: 'varchar' },
            { name: 'entityId', type: 'varchar' },
            { name: 'metadata', type: 'jsonb', default: "'{}'::jsonb" },
            { name: 'actorId', type: 'uuid', isNullable: true },
          ],
        }),
      );
    }

    await ensureColumn(
      queryRunner,
      'regions',
      new TableColumn({ name: 'sortOrder', type: 'int', default: 0 }),
    );
    await queryRunner.query(`UPDATE "regions" SET "sortOrder" = 0 WHERE "sortOrder" IS NULL`);
    await queryRunner.query(`ALTER TABLE "regions" ALTER COLUMN "sortOrder" SET DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "regions" ALTER COLUMN "sortOrder" SET NOT NULL`);

    await ensureColumn(
      queryRunner,
      'delegations',
      new TableColumn({ name: 'sortOrder', type: 'int', default: 0 }),
    );
    await queryRunner.query(`UPDATE "delegations" SET "sortOrder" = 0 WHERE "sortOrder" IS NULL`);
    await queryRunner.query(`ALTER TABLE "delegations" ALTER COLUMN "sortOrder" SET DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "delegations" ALTER COLUMN "sortOrder" SET NOT NULL`);

    await ensureColumn(queryRunner, 'users', new TableColumn({ name: 'firstName', type: 'varchar', isNullable: true }));
    await ensureColumn(queryRunner, 'users', new TableColumn({ name: 'lastName', type: 'varchar', isNullable: true }));
    await ensureColumn(queryRunner, 'users', new TableColumn({ name: 'grade', type: 'varchar', isNullable: true }));
    await ensureColumn(queryRunner, 'users', new TableColumn({ name: 'phone', type: 'varchar', isNullable: true }));

    const hasFullName = await queryRunner.hasColumn('users', 'fullName');
    if (hasFullName) {
      await queryRunner.query(`
        UPDATE "users"
        SET "firstName" = COALESCE(NULLIF(split_part("fullName", ' ', 1), ''), 'Usuario'),
            "lastName" = COALESCE(NULLIF(btrim(substring("fullName" from length(split_part("fullName", ' ', 1)) + 1)), ''), 'Sin apellido')
        WHERE ("firstName" IS NULL OR "lastName" IS NULL)
      `);
    }

    await queryRunner.query(`UPDATE "users" SET "firstName" = 'Usuario' WHERE "firstName" IS NULL`);
    await queryRunner.query(`UPDATE "users" SET "lastName" = 'Sin apellido' WHERE "lastName" IS NULL`);
    await queryRunner.query(`UPDATE "users" SET "grade" = 'N/A' WHERE "grade" IS NULL`);
    await queryRunner.query(`UPDATE "users" SET "phone" = '0000000000' WHERE "phone" IS NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "grade" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL`);

    if (hasFullName) {
      await queryRunner.dropColumn('users', 'fullName');
    }

    await ensureIndex(
      queryRunner,
      'regions',
      new TableIndex({ name: 'IDX_regions_sort_order', columnNames: ['sortOrder'] }),
    );
    await ensureIndex(
      queryRunner,
      'delegations',
      new TableIndex({ name: 'IDX_delegations_sort_order', columnNames: ['sortOrder'] }),
    );

    await ensureForeignKey(
      queryRunner,
      'delegations',
      new TableForeignKey({
        name: 'FK_delegations_region',
        columnNames: ['regionId'],
        referencedTableName: 'regions',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await ensureForeignKey(
      queryRunner,
      'users',
      new TableForeignKey({
        name: 'FK_users_region',
        columnNames: ['regionId'],
        referencedTableName: 'regions',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await ensureForeignKey(
      queryRunner,
      'users',
      new TableForeignKey({
        name: 'FK_users_delegation',
        columnNames: ['delegationId'],
        referencedTableName: 'delegations',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await ensureForeignKey(
      queryRunner,
      'records',
      new TableForeignKey({
        name: 'FK_records_delegation',
        columnNames: ['delegationId'],
        referencedTableName: 'delegations',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await ensureForeignKey(
      queryRunner,
      'records',
      new TableForeignKey({
        name: 'FK_records_created_by',
        columnNames: ['createdById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await ensureForeignKey(
      queryRunner,
      'audit_logs',
      new TableForeignKey({
        name: 'FK_audit_logs_actor',
        columnNames: ['actorId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs', true);
    await queryRunner.dropTable('records', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.dropTable('delegations', true);
    await queryRunner.dropTable('regions', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."${USER_ROLE_ENUM}"`);
  }
}
