import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1714300000000 implements MigrationInterface {
  name = 'InitSchema1714300000000';

  private async tableExists(queryRunner: QueryRunner, name: string): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
      [name],
    );
    return result[0].exists;
  }

  private async constraintExists(queryRunner: QueryRunner, table: string, name: string): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = $1 AND constraint_name = $2)`,
      [table, name],
    );
    return result[0].exists;
  }

  private async enumTypeExists(queryRunner: QueryRunner, name: string): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = $1)`,
      [name],
    );
    return result[0].exists;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. regions
    if (!(await this.tableExists(queryRunner, 'regions'))) {
      await queryRunner.query(`
        CREATE TABLE "regions" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "name" character varying NOT NULL,
          "code" character varying NOT NULL,
          "sortOrder" integer NOT NULL DEFAULT '0',
          CONSTRAINT "UQ_regions_name" UNIQUE ("name"),
          CONSTRAINT "UQ_regions_code" UNIQUE ("code"),
          CONSTRAINT "PK_regions_id" PRIMARY KEY ("id")
        )
      `);
    }

    // 2. delegations
    if (!(await this.tableExists(queryRunner, 'delegations'))) {
      await queryRunner.query(`
        CREATE TABLE "delegations" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "name" character varying NOT NULL,
          "sortOrder" integer NOT NULL DEFAULT '0',
          "regionId" uuid NOT NULL,
          CONSTRAINT "PK_delegations_id" PRIMARY KEY ("id")
        )
      `);
    }
    if (!(await this.constraintExists(queryRunner, 'delegations', 'FK_delegations_regionId'))) {
      await queryRunner.query(`ALTER TABLE "delegations" ADD CONSTRAINT "FK_delegations_regionId" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    // 3. users
    if (!(await this.enumTypeExists(queryRunner, 'users_role_enum'))) {
      await queryRunner.query(`
        CREATE TYPE "users_role_enum" AS ENUM (
          'enlace',
          'director_operativo',
          'plantilla_vehicular',
          'director_general',
          'superadmin',
          'coordinacion'
        )
      `);
    }
    if (!(await this.tableExists(queryRunner, 'users'))) {
      await queryRunner.query(`
        CREATE TABLE "users" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "firstName" character varying NOT NULL,
          "lastName" character varying NOT NULL,
          "grade" character varying NOT NULL,
          "phone" character varying NOT NULL,
          "email" character varying NOT NULL,
          "passwordHash" character varying NOT NULL,
          "role" "users_role_enum" NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          "regionId" uuid,
          "delegationId" uuid,
          CONSTRAINT "UQ_users_email" UNIQUE ("email"),
          CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
        )
      `);
    }
    if (!(await this.constraintExists(queryRunner, 'users', 'FK_users_regionId'))) {
      await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_regionId" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'users', 'FK_users_delegationId'))) {
      await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_delegationId" FOREIGN KEY ("delegationId") REFERENCES "delegations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    // 4. audit_logs
    if (!(await this.tableExists(queryRunner, 'audit_logs'))) {
      await queryRunner.query(`
        CREATE TABLE "audit_logs" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "action" character varying NOT NULL,
          "entityType" character varying NOT NULL,
          "entityId" character varying NOT NULL,
          "metadata" jsonb NOT NULL DEFAULT '{}',
          "actorId" uuid,
          CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
        )
      `);
    }
    if (!(await this.constraintExists(queryRunner, 'audit_logs', 'FK_audit_logs_actorId'))) {
      await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_actorId" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    // 5. records
    if (!(await this.tableExists(queryRunner, 'records'))) {
      await queryRunner.query(`
        CREATE TABLE "records" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "plates" character varying NOT NULL,
          "brand" character varying NOT NULL,
          "type" character varying NOT NULL,
          "useType" character varying NOT NULL,
          "vehicleClass" character varying NOT NULL,
          "model" character varying NOT NULL,
          "engineNumber" character varying NOT NULL,
          "serialNumber" character varying NOT NULL,
          "custodian" character varying NOT NULL,
          "patrolNumber" character varying NOT NULL,
          "physicalStatus" character varying NOT NULL,
          "status" character varying NOT NULL,
          "assetClassification" character varying NOT NULL,
          "observation" text NOT NULL DEFAULT '',
          "delegationId" uuid NOT NULL,
          "createdById" uuid NOT NULL,
          CONSTRAINT "PK_records_id" PRIMARY KEY ("id")
        )
      `);
    }
    if (!(await this.constraintExists(queryRunner, 'records', 'FK_records_delegationId'))) {
      await queryRunner.query(`ALTER TABLE "records" ADD CONSTRAINT "FK_records_delegationId" FOREIGN KEY ("delegationId") REFERENCES "delegations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'records', 'FK_records_createdById'))) {
      await queryRunner.query(`ALTER TABLE "records" ADD CONSTRAINT "FK_records_createdById" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    // 6. vehicle_photos
    if (!(await this.tableExists(queryRunner, 'vehicle_photos'))) {
      await queryRunner.query(`
        CREATE TABLE "vehicle_photos" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "fileName" character varying NOT NULL,
          "filePath" character varying NOT NULL,
          "mimeType" character varying NOT NULL,
          "recordId" uuid NOT NULL,
          "uploadedById" uuid NOT NULL,
          CONSTRAINT "PK_vehicle_photos_id" PRIMARY KEY ("id")
        )
      `);
    }
    if (!(await this.constraintExists(queryRunner, 'vehicle_photos', 'FK_vehicle_photos_recordId'))) {
      await queryRunner.query(`ALTER TABLE "vehicle_photos" ADD CONSTRAINT "FK_vehicle_photos_recordId" FOREIGN KEY ("recordId") REFERENCES "records"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'vehicle_photos', 'FK_vehicle_photos_uploadedById'))) {
      await queryRunner.query(`ALTER TABLE "vehicle_photos" ADD CONSTRAINT "FK_vehicle_photos_uploadedById" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    // 7. vehicle_transfers
    if (!(await this.tableExists(queryRunner, 'vehicle_transfers'))) {
      await queryRunner.query(`
        CREATE TABLE "vehicle_transfers" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "reason" text NOT NULL DEFAULT '',
          "movedAt" TIMESTAMP NOT NULL,
          "recordId" uuid NOT NULL,
          "fromDelegationId" uuid NOT NULL,
          "toDelegationId" uuid NOT NULL,
          "movedById" uuid NOT NULL,
          CONSTRAINT "PK_vehicle_transfers_id" PRIMARY KEY ("id")
        )
      `);
    }
    if (!(await this.constraintExists(queryRunner, 'vehicle_transfers', 'FK_vehicle_transfers_recordId'))) {
      await queryRunner.query(`ALTER TABLE "vehicle_transfers" ADD CONSTRAINT "FK_vehicle_transfers_recordId" FOREIGN KEY ("recordId") REFERENCES "records"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'vehicle_transfers', 'FK_vehicle_transfers_fromDelegationId'))) {
      await queryRunner.query(`ALTER TABLE "vehicle_transfers" ADD CONSTRAINT "FK_vehicle_transfers_fromDelegationId" FOREIGN KEY ("fromDelegationId") REFERENCES "delegations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'vehicle_transfers', 'FK_vehicle_transfers_toDelegationId'))) {
      await queryRunner.query(`ALTER TABLE "vehicle_transfers" ADD CONSTRAINT "FK_vehicle_transfers_toDelegationId" FOREIGN KEY ("toDelegationId") REFERENCES "delegations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'vehicle_transfers', 'FK_vehicle_transfers_movedById'))) {
      await queryRunner.query(`ALTER TABLE "vehicle_transfers" ADD CONSTRAINT "FK_vehicle_transfers_movedById" FOREIGN KEY ("movedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    // 8. vehicle_roster_reports
    if (!(await this.tableExists(queryRunner, 'vehicle_roster_reports'))) {
      await queryRunner.query(`
        CREATE TABLE "vehicle_roster_reports" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "reportScope" character varying NOT NULL DEFAULT 'DELEGATION',
          "hasChanges" boolean NOT NULL DEFAULT false,
          "changesSinceLastReport" integer NOT NULL DEFAULT '0',
          "confirmedDelegationReports" integer NOT NULL DEFAULT '0',
          "notes" text NOT NULL DEFAULT '',
          "submittedAt" TIMESTAMP NOT NULL,
          "delegationId" uuid,
          "regionId" uuid,
          "submittedById" uuid NOT NULL,
          CONSTRAINT "PK_vehicle_roster_reports_id" PRIMARY KEY ("id")
        )
      `);
    }
    if (!(await this.constraintExists(queryRunner, 'vehicle_roster_reports', 'FK_vehicle_roster_reports_delegationId'))) {
      await queryRunner.query(`ALTER TABLE "vehicle_roster_reports" ADD CONSTRAINT "FK_vehicle_roster_reports_delegationId" FOREIGN KEY ("delegationId") REFERENCES "delegations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'vehicle_roster_reports', 'FK_vehicle_roster_reports_regionId'))) {
      await queryRunner.query(`ALTER TABLE "vehicle_roster_reports" ADD CONSTRAINT "FK_vehicle_roster_reports_regionId" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'vehicle_roster_reports', 'FK_vehicle_roster_reports_submittedById'))) {
      await queryRunner.query(`ALTER TABLE "vehicle_roster_reports" ADD CONSTRAINT "FK_vehicle_roster_reports_submittedById" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    // 9. conversations
    if (!(await this.tableExists(queryRunner, 'conversations'))) {
      await queryRunner.query(`
        CREATE TABLE "conversations" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "title" character varying,
          "isGroup" boolean NOT NULL DEFAULT false,
          "lastMessageAt" TIMESTAMP,
          CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id")
        )
      `);
    }

    // 10. conversation_participants_user (join table)
    if (!(await this.tableExists(queryRunner, 'conversation_participants_user'))) {
      await queryRunner.query(`
        CREATE TABLE "conversation_participants_user" (
          "conversationId" uuid NOT NULL,
          "userId" uuid NOT NULL,
          CONSTRAINT "PK_conversation_participants_user" PRIMARY KEY ("conversationId", "userId")
        )
      `);
    }
    if (!(await this.constraintExists(queryRunner, 'conversation_participants_user', 'FK_cpu_conversationId'))) {
      await queryRunner.query(`ALTER TABLE "conversation_participants_user" ADD CONSTRAINT "FK_cpu_conversationId" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'conversation_participants_user', 'FK_cpu_userId'))) {
      await queryRunner.query(`ALTER TABLE "conversation_participants_user" ADD CONSTRAINT "FK_cpu_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    // 11. messages
    if (!(await this.tableExists(queryRunner, 'messages'))) {
      await queryRunner.query(`
        CREATE TABLE "messages" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "content" text NOT NULL,
          "isRead" boolean NOT NULL DEFAULT false,
          "readAt" TIMESTAMP,
          "conversationId" uuid NOT NULL,
          "senderId" uuid NOT NULL,
          CONSTRAINT "PK_messages_id" PRIMARY KEY ("id")
        )
      `);
    }
    if (!(await this.constraintExists(queryRunner, 'messages', 'FK_messages_conversationId'))) {
      await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversationId" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'messages', 'FK_messages_senderId'))) {
      await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_senderId" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    // 12. message_photos
    if (!(await this.tableExists(queryRunner, 'message_photos'))) {
      await queryRunner.query(`
        CREATE TABLE "message_photos" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          "fileName" character varying NOT NULL,
          "filePath" character varying NOT NULL,
          "mimeType" character varying NOT NULL,
          "messageId" uuid NOT NULL,
          "uploadedById" uuid NOT NULL,
          CONSTRAINT "PK_message_photos_id" PRIMARY KEY ("id")
        )
      `);
    }
    if (!(await this.constraintExists(queryRunner, 'message_photos', 'FK_message_photos_messageId'))) {
      await queryRunner.query(`ALTER TABLE "message_photos" ADD CONSTRAINT "FK_message_photos_messageId" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    if (!(await this.constraintExists(queryRunner, 'message_photos', 'FK_message_photos_uploadedById'))) {
      await queryRunner.query(`ALTER TABLE "message_photos" ADD CONSTRAINT "FK_message_photos_uploadedById" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "message_photos" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversation_participants_user" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_roster_reports" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_transfers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_photos" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "records" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "delegations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "regions" CASCADE`);
  }
}
