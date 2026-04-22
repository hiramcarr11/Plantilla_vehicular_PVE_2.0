import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { AuditLogsService } from 'src/modules/audit-logs/audit-logs.service';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { RealtimeGateway } from 'src/modules/realtime/realtime.gateway';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { CreateRecordDto } from './dto/create-record.dto';
import { RecordEntity } from './entities/record.entity';

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

type AuthUser = {
  sub: string;
  role: Role;
  regionId: string | null;
  delegationId: string | null;
};

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(RecordEntity)
    private readonly recordRepository: Repository<RecordEntity>,
    @InjectRepository(DelegationEntity)
    private readonly delegationRepository: Repository<DelegationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly auditLogsService: AuditLogsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(dto: CreateRecordDto, authUser: AuthUser) {
    const createdBy = await this.userRepository.findOneBy({ id: authUser.sub });
    const delegation = await this.delegationRepository.findOne({
      where: { id: dto.delegationId },
      relations: { region: true },
    });

    if (!createdBy || !delegation) {
      throw new NotFoundException('User or delegation not found.');
    }

    const normalizedDto: CreateRecordDto = {
      ...dto,
      plates: normalizeText(dto.plates).toUpperCase(),
      brand: normalizeText(dto.brand).toUpperCase(),
      type: normalizeText(dto.type).toUpperCase(),
      useType: normalizeText(dto.useType).toUpperCase(),
      vehicleClass: normalizeText(dto.vehicleClass).toUpperCase(),
      model: normalizeText(dto.model).toUpperCase(),
      engineNumber: normalizeText(dto.engineNumber).toUpperCase(),
      serialNumber: normalizeText(dto.serialNumber).toUpperCase(),
      custodian: normalizeText(dto.custodian).toUpperCase(),
      patrolNumber: normalizeText(dto.patrolNumber).toUpperCase(),
      physicalStatus: normalizeText(dto.physicalStatus).toUpperCase(),
      status: normalizeText(dto.status).toUpperCase(),
      assetClassification: normalizeText(dto.assetClassification).toUpperCase(),
      observation: normalizeText(dto.observation),
      delegationId: dto.delegationId,
    };

    const record = await this.recordRepository.save(
      this.recordRepository.create({
        ...normalizedDto,
        delegation,
        createdBy,
      }),
    );

    const hydratedRecord = await this.findOne(record.id);

    await this.auditLogsService.register({
      actorId: authUser.sub,
      action: 'RECORD_CREATED',
      entityType: 'record',
      entityId: record.id,
      metadata: {
        delegationId: delegation.id,
        regionId: delegation.region.id,
      },
    });

    this.realtimeGateway.emitRecordCreated(hydratedRecord);

    return hydratedRecord;
  }

  async findOne(id: string) {
    const record = await this.recordRepository.findOne({
      where: { id },
      relations: {
        delegation: {
          region: true,
        },
        createdBy: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Record not found.');
    }

    return record;
  }

  findMine(userId: string) {
    return this.recordRepository.find({
      where: {
        createdBy: {
          id: userId,
        },
      },
      relations: {
        delegation: {
          region: true,
        },
        createdBy: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findRegionalView(regionId: string) {
    const records = await this.recordRepository.find({
      where: {
        delegation: {
          region: {
            id: regionId,
          },
        },
      },
      relations: {
        delegation: {
          region: true,
        },
        createdBy: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return this.groupRecords(records);
  }

  async findAdminView() {
    const records = await this.recordRepository.find({
      relations: {
        delegation: {
          region: true,
        },
        createdBy: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return this.groupRecords(records);
  }

  async softDelete(id: string, authUser: AuthUser) {
    const record = await this.findOne(id);
    await this.recordRepository.softDelete(id);

    await this.auditLogsService.register({
      actorId: authUser.sub,
      action: 'RECORD_SOFT_DELETED',
      entityType: 'record',
      entityId: record.id,
      metadata: {
        delegationId: record.delegation.id,
      },
    });
  }

  private groupRecords(records: RecordEntity[]) {
    const regionsMap = new Map<
      string,
      {
        regionId: string;
        regionName: string;
        regionSortOrder: number;
        delegations: Map<
          string,
          {
            delegationId: string;
            delegationName: string;
            delegationSortOrder: number;
            records: RecordEntity[];
          }
        >;
      }
    >();

    for (const record of records) {
      const regionId = record.delegation.region.id;
      const delegationId = record.delegation.id;

      if (!regionsMap.has(regionId)) {
        regionsMap.set(regionId, {
          regionId,
          regionName: record.delegation.region.name,
          regionSortOrder: record.delegation.region.sortOrder,
          delegations: new Map(),
        });
      }

      const region = regionsMap.get(regionId)!;

      if (!region.delegations.has(delegationId)) {
        region.delegations.set(delegationId, {
          delegationId,
          delegationName: record.delegation.name,
          delegationSortOrder: record.delegation.sortOrder,
          records: [],
        });
      }

      region.delegations.get(delegationId)!.records.push(record);
    }

    return Array.from(regionsMap.values())
      .sort((left, right) => left.regionSortOrder - right.regionSortOrder)
      .map((region) => ({
        regionId: region.regionId,
        regionName: region.regionName,
        delegations: Array.from(region.delegations.values()).sort(
          (left, right) => left.delegationSortOrder - right.delegationSortOrder,
        ),
      }));
  }
}
