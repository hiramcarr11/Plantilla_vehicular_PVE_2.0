import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from 'src/modules/audit-logs/audit-logs.module';
import { AuditLogEntity } from 'src/modules/audit-logs/entities/audit-log.entity';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { RecordEntity } from './entities/record.entity';
import { VehiclePhotoEntity } from './entities/vehicle-photo.entity';
import { VehicleRosterReportEntity } from './entities/vehicle-roster-report.entity';
import { VehicleTransferEntity } from './entities/vehicle-transfer.entity';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditLogEntity,
      DelegationEntity,
      RecordEntity,
      UserEntity,
      VehiclePhotoEntity,
      VehicleRosterReportEntity,
      VehicleTransferEntity,
    ]),
    AuditLogsModule,
    StorageModule,
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
