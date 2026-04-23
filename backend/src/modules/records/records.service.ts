import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { AuditLogsService } from 'src/modules/audit-logs/audit-logs.service';
import { RECORD_FIELD_CATALOG } from 'src/modules/catalog/record-field-catalog';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { RealtimeGateway } from 'src/modules/realtime/realtime.gateway';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { CreateRecordDto } from './dto/create-record.dto';
import { RecordEntity } from './entities/record.entity';

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function calculateNetActive(totalUnits: number, statusBreakdown: Record<string, number>) {
  return Math.max(
    totalUnits -
      (statusBreakdown.INCATIVO ?? 0) -
      (statusBreakdown.SINIESTRADO ?? 0) -
      (statusBreakdown['PARA BAJA'] ?? 0),
    0,
  );
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

  async findAdminView(
    regionId?: string,
    delegationId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const query = this.recordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.delegation', 'delegation')
      .leftJoinAndSelect('delegation.region', 'region')
      .leftJoinAndSelect('record.createdBy', 'createdBy')
      .orderBy('record.createdAt', 'DESC');

    if (regionId) {
      query.andWhere('region.id = :regionId', { regionId });
    }

    if (delegationId) {
      query.andWhere('delegation.id = :delegationId', { delegationId });
    }

    if (dateFrom) {
      query.andWhere('record.createdAt >= :dateFrom', { dateFrom: `${dateFrom}T00:00:00.000Z` });
    }

    if (dateTo) {
      query.andWhere('record.createdAt <= :dateTo', { dateTo: `${dateTo}T23:59:59.999Z` });
    }

    const records = await query.getMany();

    return this.groupRecords(records);
  }

  async findDirectorOverview(
    regionId?: string,
    delegationId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const query = this.recordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.delegation', 'delegation')
      .leftJoinAndSelect('delegation.region', 'region')
      .leftJoinAndSelect('record.createdBy', 'createdBy')
      .orderBy('record.createdAt', 'DESC');

    if (regionId) {
      query.andWhere('region.id = :regionId', { regionId });
    }

    if (delegationId) {
      query.andWhere('delegation.id = :delegationId', { delegationId });
    }

    if (dateFrom) {
      query.andWhere('record.createdAt >= :dateFrom', { dateFrom: `${dateFrom}T00:00:00.000Z` });
    }

    if (dateTo) {
      query.andWhere('record.createdAt <= :dateTo', { dateTo: `${dateTo}T23:59:59.999Z` });
    }

    const records = await query.getMany();

    const statuses = ['INCATIVO', 'SINIESTRADO', 'PARA BAJA', 'OTRO'];
    const physicalStatuses: string[] = [];
    const allowedStatusValues = new Set<string>(
      RECORD_FIELD_CATALOG.status.options.map((option) => option.value),
    );
    const vehicleClassRows = new Map<
      string,
      {
        vehicleClass: string;
        totalUnits: number;
        totalActive: number;
        statusBreakdown: Record<string, number>;
        physicalStatusBreakdown: Record<string, number>;
      }
    >();
    const customStatusDescriptions: string[] = [];
    const capturedObservations: string[] = [];

    for (const record of records) {
      const vehicleClass = record.vehicleClass;

      if (!vehicleClassRows.has(vehicleClass)) {
        vehicleClassRows.set(vehicleClass, {
          vehicleClass,
          totalUnits: 0,
          totalActive: 0,
          statusBreakdown: Object.fromEntries(statuses.map((status) => [status, 0])),
          physicalStatusBreakdown: Object.fromEntries(
            physicalStatuses.map((status) => [status, 0]),
          ),
        });
      }

      const row = vehicleClassRows.get(vehicleClass)!;
      row.totalUnits += 1;

      if (record.status in row.statusBreakdown) {
        row.statusBreakdown[record.status] += 1;
      } else if (record.status !== 'ACTIVO') {
        row.statusBreakdown.OTRO += 1;
      }

      if (record.physicalStatus in row.physicalStatusBreakdown) {
        row.physicalStatusBreakdown[record.physicalStatus] += 1;
      }

      if (!allowedStatusValues.has(record.status)) {
        customStatusDescriptions.push(
          `PLACAS: ${record.plates} | TIPO: ${record.vehicleClass} | DELEGACIÓN: ${record.delegation.name} | OFICIAL: ${record.createdBy.firstName} ${record.createdBy.lastName} | ESTATUS CAPTURADO EN OTRO: ${record.status}`,
        );
      }

      if (record.observation.trim().length > 0) {
        capturedObservations.push(
          `PLACAS: ${record.plates} | TIPO: ${record.vehicleClass} | DELEGACIÓN: ${record.delegation.name} | OFICIAL: ${record.createdBy.firstName} ${record.createdBy.lastName} | OBSERVACIÓN: ${record.observation}`,
        );
      }
    }

    const rows = Array.from(vehicleClassRows.values())
      .map((row) => ({
        ...row,
        totalActive: calculateNetActive(row.totalUnits, row.statusBreakdown),
      }))
      .sort((left, right) => left.vehicleClass.localeCompare(right.vehicleClass));

    const resume = {
      totalUnits: rows.reduce((total, row) => total + row.totalUnits, 0),
      totalActive: rows.reduce((total, row) => total + row.totalActive, 0),
      statusBreakdown: Object.fromEntries(
        statuses.map((status) => [
          status,
          rows.reduce((total, row) => total + row.statusBreakdown[status], 0),
        ]),
      ),
      physicalStatusBreakdown: Object.fromEntries(
        physicalStatuses.map((status) => [
          status,
          rows.reduce((total, row) => total + row.physicalStatusBreakdown[status], 0),
        ]),
      ),
    };

    const availableFilters = await this.delegationRepository.find({
      relations: {
        region: true,
      },
      order: {
        region: {
          sortOrder: 'ASC',
        },
        sortOrder: 'ASC',
      },
    });

    const regionsMap = new Map<string, { regionId: string; regionName: string; delegations: { id: string; name: string }[] }>();

    for (const delegation of availableFilters) {
      if (!regionsMap.has(delegation.region.id)) {
        regionsMap.set(delegation.region.id, {
          regionId: delegation.region.id,
          regionName: delegation.region.name,
          delegations: [],
        });
      }

      regionsMap.get(delegation.region.id)!.delegations.push({
        id: delegation.id,
        name: delegation.name,
      });
    }

    return {
      kpis: {
        totalRecords: records.length,
        totalRegions: new Set(records.map((record) => record.delegation.region.id)).size,
        totalDelegations: new Set(records.map((record) => record.delegation.id)).size,
        totalActive: calculateNetActive(records.length, resume.statusBreakdown),
      },
      table: {
        date:
          records.length > 0
            ? records.reduce(
                (latestDate, record) =>
                  new Date(record.createdAt) > new Date(latestDate)
                    ? record.createdAt
                    : latestDate,
                records[0].createdAt,
              )
            : new Date().toISOString(),
        statuses,
        physicalStatuses,
        rows,
        resume,
        customStatusDescriptions,
        observations: capturedObservations,
      },
      filters: {
        selectedRegionId: regionId ?? null,
        selectedDelegationId: delegationId ?? null,
        regions: Array.from(regionsMap.values()),
      },
    };
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
