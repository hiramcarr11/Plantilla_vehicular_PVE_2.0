import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordEntity } from 'src/modules/records/entities/record.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { DelegationEntity } from './entities/delegation.entity';
import { RegionEntity } from './entities/region.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RegionEntity, DelegationEntity, UserEntity, RecordEntity])],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService, TypeOrmModule],
})
export class CatalogModule {}
