import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { AuditLogsService } from 'src/modules/audit-logs/audit-logs.service';
import { AuditLogEntity } from 'src/modules/audit-logs/entities/audit-log.entity';
import { RECORD_FIELD_CATALOG } from 'src/modules/catalog/record-field-catalog';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { RealtimeGateway } from 'src/modules/realtime/realtime.gateway';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { CreateRecordDto } from './dto/create-record.dto';
import { SubmitRosterReportDto } from './dto/submit-roster-report.dto';
import { TransferRecordDto } from './dto/transfer-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { RecordEntity } from './entities/record.entity';
import { VehicleRosterReportEntity } from './entities/vehicle-roster-report.entity';
import { VehicleTransferEntity } from './entities/vehicle-transfer.entity';

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

const reportableMovementActions = [
  'RECORD_CREATED',
  'RECORD_UPDATED',
  'RECORD_SOFT_DELETED',
  'RECORD_TRANSFERRED',
];

const editableRecordFields = [
  'plates',
  'brand',
  'type',
  'useType',
  'vehicleClass',
  'model',
  'engineNumber',
  'serialNumber',
  'custodian',
  'patrolNumber',
  'physicalStatus',
  'status',
  'assetClassification',
  'observation',
] as const;

type EditableRecordField = (typeof editableRecordFields)[number];
type NormalizedRecordValues = Pick<RecordEntity, EditableRecordField>;

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(RecordEntity)
    private readonly recordRepository: Repository<RecordEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(DelegationEntity)
    private readonly delegationRepository: Repository<DelegationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(VehicleRosterReportEntity)
    private readonly rosterReportRepository: Repository<VehicleRosterReportEntity>,
    @InjectRepository(VehicleTransferEntity)
    private readonly vehicleTransferRepository: Repository<VehicleTransferEntity>,
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

    this.ensureCapturistDelegationAccess(authUser, delegation.id);

    const normalizedDto = {
      ...this.normalizeRecordValues(dto),
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

  async update(id: string, dto: UpdateRecordDto, authUser: AuthUser) {
    const record = await this.findOne(id);
    this.ensureRecordEditAccess(record, authUser);

    const before = this.pickRecordValues(record);
    const normalizedValues = this.normalizeRecordValues(
      this.mergeDefinedRecordValues(before, dto),
    );
    const changedFields = editableRecordFields.filter(
      (fieldName) => before[fieldName] !== normalizedValues[fieldName],
    );

    if (changedFields.length === 0) {
      return record;
    }

    await this.recordRepository.update(id, normalizedValues);
    const updatedRecord = await this.findOne(id);

    await this.auditLogsService.register({
      actorId: authUser.sub,
      action: 'RECORD_UPDATED',
      entityType: 'record',
      entityId: id,
      metadata: {
        delegationId: record.delegation.id,
        regionId: record.delegation.region.id,
        changedFields,
        before: Object.fromEntries(changedFields.map((fieldName) => [fieldName, before[fieldName]])),
        after: Object.fromEntries(
          changedFields.map((fieldName) => [fieldName, normalizedValues[fieldName]]),
        ),
      },
    });

    this.realtimeGateway.emitRecordChanged(updatedRecord);

    return updatedRecord;
  }

  async transfer(id: string, dto: TransferRecordDto, authUser: AuthUser) {
    const record = await this.findOne(id);
    const movedBy = await this.userRepository.findOneBy({ id: authUser.sub });
    const toDelegation = await this.delegationRepository.findOne({
      where: { id: dto.delegationId },
      relations: { region: true },
    });

    if (!movedBy || !toDelegation) {
      throw new NotFoundException('User or target delegation not found.');
    }

    if (record.delegation.id === toDelegation.id) {
      throw new BadRequestException('Target delegation must be different.');
    }

    const fromDelegation = record.delegation;
    const movedAt = new Date();

    await this.vehicleTransferRepository.save(
      this.vehicleTransferRepository.create({
        record,
        fromDelegation,
        toDelegation,
        movedBy,
        movedAt,
        reason: normalizeText(dto.reason),
      }),
    );

    record.delegation = toDelegation;
    await this.recordRepository.save(record);
    const updatedRecord = await this.findOne(id);

    await this.auditLogsService.register({
      actorId: authUser.sub,
      action: 'RECORD_TRANSFERRED',
      entityType: 'record',
      entityId: id,
      metadata: {
        delegationId: toDelegation.id,
        fromDelegationId: fromDelegation.id,
        fromRegionId: fromDelegation.region.id,
        toDelegationId: toDelegation.id,
        toRegionId: toDelegation.region.id,
        reason: normalizeText(dto.reason),
      },
    });

    this.realtimeGateway.emitRecordChanged(updatedRecord);

    return updatedRecord;
  }

  async submitRosterReport(dto: SubmitRosterReportDto, authUser: AuthUser) {
    if (!authUser.delegationId) {
      throw new ForbiddenException('User does not have an assigned delegation.');
    }

    const submittedBy = await this.userRepository.findOneBy({ id: authUser.sub });
    const delegation = await this.delegationRepository.findOne({
      where: { id: authUser.delegationId },
      relations: { region: true },
    });

    if (!submittedBy || !delegation) {
      throw new NotFoundException('User or delegation not found.');
    }

    const lastReport = await this.findLastRosterReport(delegation.id);
    const changesSinceLastReport = await this.countDelegationMovementsSince(
      delegation.id,
      lastReport?.submittedAt ?? null,
    );
    const report = await this.rosterReportRepository.save(
      this.rosterReportRepository.create({
        delegation,
        submittedBy,
        hasChanges: changesSinceLastReport > 0,
        changesSinceLastReport,
        notes: normalizeText(dto.notes ?? ''),
        submittedAt: new Date(),
      }),
    );

    await this.auditLogsService.register({
      actorId: authUser.sub,
      action:
        changesSinceLastReport > 0
          ? 'ROSTER_REPORT_SUBMITTED_WITH_CHANGES'
          : 'ROSTER_REPORT_SUBMITTED_WITHOUT_CHANGES',
      entityType: 'vehicle_roster_report',
      entityId: report.id,
      metadata: {
        delegationId: delegation.id,
        regionId: delegation.region.id,
        changesSinceLastReport,
      },
    });

    const hydratedReport = await this.findRosterReport(report.id);
    this.realtimeGateway.emitRosterReportSubmitted(hydratedReport);

    return hydratedReport;
  }

  async findMyRosterReports(authUser: AuthUser) {
    if (!authUser.delegationId) {
      return [];
    }

    return this.rosterReportRepository.find({
      where: {
        delegation: {
          id: authUser.delegationId,
        },
      },
      relations: {
        delegation: {
          region: true,
        },
        submittedBy: true,
      },
      order: {
        submittedAt: 'DESC',
      },
      take: 20,
    });
  }

  async findRosterReportOverview() {
    const delegations = await this.delegationRepository.find({
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

    const rows = [];

    for (const delegation of delegations) {
      const lastReport = await this.findLastRosterReport(delegation.id);
      const pendingChanges = await this.countDelegationMovementsSince(
        delegation.id,
        lastReport?.submittedAt ?? null,
      );

      rows.push({
        delegationId: delegation.id,
        delegationName: delegation.name,
        regionId: delegation.region.id,
        regionName: delegation.region.name,
        status: lastReport
          ? pendingChanges > 0
            ? 'PENDING_CHANGES'
            : lastReport.hasChanges
              ? 'REPORTED_WITH_CHANGES'
              : 'REPORTED_WITHOUT_CHANGES'
          : 'NOT_REPORTED',
        pendingChanges,
        lastReport,
      });
    }

    return rows;
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
        regionId: record.delegation.region.id,
      },
    });
  }

  private async findRosterReport(id: string) {
    const report = await this.rosterReportRepository.findOne({
      where: { id },
      relations: {
        delegation: {
          region: true,
        },
        submittedBy: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Roster report not found.');
    }

    return report;
  }

  private findLastRosterReport(delegationId: string) {
    return this.rosterReportRepository.findOne({
      where: {
        delegation: {
          id: delegationId,
        },
      },
      relations: {
        delegation: true,
        submittedBy: true,
      },
      order: {
        submittedAt: 'DESC',
      },
    });
  }

  private countDelegationMovementsSince(delegationId: string, since: Date | null) {
    const query = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .where('auditLog.action IN (:...actions)', { actions: reportableMovementActions })
      .andWhere(
        new Brackets((whereBuilder) => {
          whereBuilder
            .where("auditLog.metadata ->> 'delegationId' = :delegationId", { delegationId })
            .orWhere("auditLog.metadata ->> 'fromDelegationId' = :delegationId", { delegationId })
            .orWhere("auditLog.metadata ->> 'toDelegationId' = :delegationId", { delegationId });
        }),
      );

    if (since) {
      query.andWhere('auditLog.createdAt > :since', { since });
    }

    return query.getCount();
  }

  private ensureCapturistDelegationAccess(authUser: AuthUser, delegationId: string) {
    if (authUser.role !== Role.Capturist) {
      return;
    }

    if (authUser.delegationId !== delegationId) {
      throw new ForbiddenException('Capturists can only use their assigned delegation.');
    }
  }

  private ensureRecordEditAccess(record: RecordEntity, authUser: AuthUser) {
    if (authUser.role !== Role.Capturist) {
      return;
    }

    if (record.createdBy.id !== authUser.sub || record.delegation.id !== authUser.delegationId) {
      throw new ForbiddenException('Capturists can only edit their own delegation records.');
    }
  }

  private normalizeRecordValues(values: NormalizedRecordValues): NormalizedRecordValues {
    return {
      plates: normalizeText(values.plates).toUpperCase(),
      brand: normalizeText(values.brand).toUpperCase(),
      type: normalizeText(values.type).toUpperCase(),
      useType: normalizeText(values.useType).toUpperCase(),
      vehicleClass: normalizeText(values.vehicleClass).toUpperCase(),
      model: normalizeText(values.model).toUpperCase(),
      engineNumber: normalizeText(values.engineNumber).toUpperCase(),
      serialNumber: normalizeText(values.serialNumber).toUpperCase(),
      custodian: normalizeText(values.custodian).toUpperCase(),
      patrolNumber: normalizeText(values.patrolNumber).toUpperCase(),
      physicalStatus: normalizeText(values.physicalStatus).toUpperCase(),
      status: normalizeText(values.status).toUpperCase(),
      assetClassification: normalizeText(values.assetClassification).toUpperCase(),
      observation: normalizeText(values.observation),
    };
  }

  private pickRecordValues(record: RecordEntity): NormalizedRecordValues {
    return {
      plates: record.plates,
      brand: record.brand,
      type: record.type,
      useType: record.useType,
      vehicleClass: record.vehicleClass,
      model: record.model,
      engineNumber: record.engineNumber,
      serialNumber: record.serialNumber,
      custodian: record.custodian,
      patrolNumber: record.patrolNumber,
      physicalStatus: record.physicalStatus,
      status: record.status,
      assetClassification: record.assetClassification,
      observation: record.observation,
    };
  }

  private mergeDefinedRecordValues(
    currentValues: NormalizedRecordValues,
    dto: UpdateRecordDto,
  ): NormalizedRecordValues {
    const mergedValues: NormalizedRecordValues = { ...currentValues };

    for (const fieldName of editableRecordFields) {
      const nextValue = dto[fieldName];

      if (nextValue !== undefined) {
        mergedValues[fieldName] = nextValue;
      }
    }

    return mergedValues;
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
