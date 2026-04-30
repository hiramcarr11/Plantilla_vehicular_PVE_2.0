import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'node:path';
import * as fs from 'node:fs';

// Entity imports using relative paths from this file's location
import { AuditLogEntity } from './modules/audit-logs/entities/audit-log.entity';
import { DelegationEntity } from './modules/catalog/entities/delegation.entity';
import { RegionEntity } from './modules/catalog/entities/region.entity';
import { ConversationEntity } from './modules/messages/entities/conversation.entity';
import { MessageEntity } from './modules/messages/entities/message.entity';
import { MessagePhotoEntity } from './modules/messages/entities/message-photo.entity';
import { RecordEntity } from './modules/records/entities/record.entity';
import { VehiclePhotoEntity } from './modules/records/entities/vehicle-photo.entity';
import { VehicleRosterReportEntity } from './modules/records/entities/vehicle-roster-report.entity';
import { VehicleTransferEntity } from './modules/records/entities/vehicle-transfer.entity';
import { UserEntity } from './modules/users/entities/user.entity';

const ENTITIES = [
  AuditLogEntity,
  ConversationEntity,
  DelegationEntity,
  MessageEntity,
  MessagePhotoEntity,
  RecordEntity,
  RegionEntity,
  UserEntity,
  VehiclePhotoEntity,
  VehicleRosterReportEntity,
  VehicleTransferEntity,
];

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/gu, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

function resolveNumber(value: string | number | undefined, fallback: number) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: resolveNumber(process.env.DATABASE_PORT ?? '5432', 5432),
  database: process.env.DATABASE_NAME ?? 'vehicle_control',
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'change_me',
  entities: ENTITIES,
  migrations: [path.join(__dirname, 'database', 'migrations', '*{.ts,.js}')],
  synchronize: false,
  migrationsRun: false,
  dropSchema: false,
  ssl:
  process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

export default dataSource;
