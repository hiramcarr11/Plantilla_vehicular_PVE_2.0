import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStorageMetadataToPhotos1714400000000 implements MigrationInterface {
  name = "AddStorageMetadataToPhotos1714400000000";

  private async columnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
      )
      `,
      [tableName, columnName],
    );

    return result[0].exists === true;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumns(queryRunner, "vehicle_photos", "vehicle-photos");
    await this.addColumns(queryRunner, "message_photos", "message-photos");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropColumns(queryRunner, "message_photos");
    await this.dropColumns(queryRunner, "vehicle_photos");
  }

  private async addColumns(
    queryRunner: QueryRunner,
    tableName: string,
    folderName: string,
  ): Promise<void> {
    if (!(await this.columnExists(queryRunner, tableName, "objectKey"))) {
      await queryRunner.query(
        `ALTER TABLE "${tableName}" ADD "objectKey" character varying`,
      );
    }

    if (!(await this.columnExists(queryRunner, tableName, "publicUrl"))) {
      await queryRunner.query(
        `ALTER TABLE "${tableName}" ADD "publicUrl" character varying`,
      );
    }

    if (!(await this.columnExists(queryRunner, tableName, "size"))) {
      await queryRunner.query(
        `ALTER TABLE "${tableName}" ADD "size" integer NOT NULL DEFAULT 0`,
      );
    }

    if (!(await this.columnExists(queryRunner, tableName, "storageProvider"))) {
      await queryRunner.query(
        `ALTER TABLE "${tableName}" ADD "storageProvider" character varying NOT NULL DEFAULT 'local'`,
      );
    }

    await queryRunner.query(
      `
      UPDATE "${tableName}"
      SET
        "objectKey" = CASE
          WHEN "filePath" LIKE '%/%' THEN "filePath"
          ELSE CONCAT('${folderName}/', "filePath")
        END,
        "publicUrl" = CASE
          WHEN "filePath" LIKE '%/%' THEN CONCAT('/uploads/', "filePath")
          ELSE CONCAT('/uploads/${folderName}/', "filePath")
        END
      WHERE "objectKey" IS NULL
         OR "publicUrl" IS NULL
      `,
    );

    await queryRunner.query(
      `ALTER TABLE "${tableName}" ALTER COLUMN "objectKey" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "${tableName}" ALTER COLUMN "publicUrl" SET NOT NULL`,
    );
  }

  private async dropColumns(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    if (await this.columnExists(queryRunner, tableName, "storageProvider")) {
      await queryRunner.query(
        `ALTER TABLE "${tableName}" DROP COLUMN "storageProvider"`,
      );
    }

    if (await this.columnExists(queryRunner, tableName, "size")) {
      await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN "size"`);
    }

    if (await this.columnExists(queryRunner, tableName, "publicUrl")) {
      await queryRunner.query(
        `ALTER TABLE "${tableName}" DROP COLUMN "publicUrl"`,
      );
    }

    if (await this.columnExists(queryRunner, tableName, "objectKey")) {
      await queryRunner.query(
        `ALTER TABLE "${tableName}" DROP COLUMN "objectKey"`,
      );
    }
  }
}
