import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordEntity } from 'src/modules/records/entities/record.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { DelegationEntity } from './entities/delegation.entity';
import { RegionEntity } from './entities/region.entity';
import { REGION_CATALOG } from './catalog.seed';
import { RECORD_FIELD_CATALOG } from './record-field-catalog';

@Injectable()
export class CatalogService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    @InjectRepository(RegionEntity)
    private readonly regionRepository: Repository<RegionEntity>,
    @InjectRepository(DelegationEntity)
    private readonly delegationRepository: Repository<DelegationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RecordEntity)
    private readonly recordRepository: Repository<RecordEntity>,
  ) {}

  async onApplicationBootstrap() {
    await this.removeObsoleteCatalog();

    for (const regionSeed of REGION_CATALOG) {
      const existingRegion = await this.regionRepository.findOne({
        where: [{ code: regionSeed.code }, { name: regionSeed.name }],
      });

      const region = await this.regionRepository.save(
        this.regionRepository.create({
          id: existingRegion?.id,
          code: regionSeed.code,
          name: regionSeed.name,
          sortOrder: regionSeed.sortOrder,
        }),
      );

      for (const delegationSeed of regionSeed.delegations) {
        const existingDelegation = await this.delegationRepository.findOne({
          where: {
            name: delegationSeed.name,
            region: {
              id: region.id,
            },
          },
          relations: {
            region: true,
          },
        });

        await this.delegationRepository.save(
          this.delegationRepository.create({
            id: existingDelegation?.id,
            name: delegationSeed.name,
            sortOrder: delegationSeed.sortOrder,
            region,
          }),
        );
      }
    }
  }

  private async removeObsoleteCatalog() {
    const allowedRegionCodes = new Set<string>(REGION_CATALOG.map((region) => region.code));
    const allowedDelegationNamesByRegion = new Map<string, Set<string>>(
      REGION_CATALOG.map((region) => [
        region.code,
        new Set<string>(region.delegations.map((delegation) => delegation.name)),
      ]),
    );

    const regions = await this.regionRepository.find({
      relations: {
        delegations: true,
      },
    });

    for (const region of regions) {
      const shouldKeepRegion = allowedRegionCodes.has(region.code);

      for (const delegation of region.delegations) {
        const shouldKeepDelegation =
          shouldKeepRegion &&
          (allowedDelegationNamesByRegion.get(region.code)?.has(delegation.name) ?? false);

        if (shouldKeepDelegation) {
          continue;
        }

        const [usersCount, recordsCount] = await Promise.all([
          this.userRepository.count({
            where: {
              delegation: {
                id: delegation.id,
              },
            },
          }),
          this.recordRepository.count({
            where: {
              delegation: {
                id: delegation.id,
              },
            },
          }),
        ]);

        if (usersCount === 0 && recordsCount === 0) {
          await this.delegationRepository.remove(delegation);
          continue;
        }

        this.logger.warn(
          `Delegation "${delegation.name}" was kept because it has ${usersCount} users and ${recordsCount} records.`,
        );
      }

      if (shouldKeepRegion) {
        continue;
      }

      const remainingDelegations = await this.delegationRepository.count({
        where: {
          region: {
            id: region.id,
          },
        },
      });
      const usersCount = await this.userRepository.count({
        where: {
          region: {
            id: region.id,
          },
        },
      });

      if (remainingDelegations === 0 && usersCount === 0) {
        await this.regionRepository.remove(region);
        continue;
      }

      this.logger.warn(
        `Region "${region.name}" was kept because it still has ${remainingDelegations} delegations or ${usersCount} users.`,
      );
    }
  }

  findAllRegions() {
    return this.regionRepository.find({
      relations: {
        delegations: true,
      },
      order: {
        sortOrder: 'ASC',
        delegations: {
          sortOrder: 'ASC',
        },
      },
    });
  }

  getRecordFieldCatalog() {
    return RECORD_FIELD_CATALOG;
  }
}
