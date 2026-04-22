import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from 'src/modules/audit-logs/audit-logs.module';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { RecordEntity } from './entities/record.entity';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecordEntity, DelegationEntity, UserEntity]),
    AuditLogsModule,
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
