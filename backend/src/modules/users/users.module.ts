import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from 'src/modules/audit-logs/audit-logs.module';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { RegionEntity } from 'src/modules/catalog/entities/region.entity';
import { SuperadminBootstrapService } from './superadmin-bootstrap.service';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RegionEntity, DelegationEntity]),
    AuditLogsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, SuperadminBootstrapService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
