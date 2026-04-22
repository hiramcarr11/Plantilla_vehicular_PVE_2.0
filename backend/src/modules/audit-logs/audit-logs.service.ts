import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealtimeGateway } from 'src/modules/realtime/realtime.gateway';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { AuditLogEntity } from './entities/audit-log.entity';

type AuditPayload = {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async register(payload: AuditPayload) {
    const actor = payload.actorId
      ? await this.userRepository.findOneBy({ id: payload.actorId })
      : null;

    const auditLog = await this.auditLogRepository.save(
      this.auditLogRepository.create({
        actor,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: payload.metadata ?? {},
      }),
    );

    this.realtimeGateway.emitAuditCreated(auditLog);

    return auditLog;
  }

  findAll() {
    return this.auditLogRepository.find({
      relations: {
        actor: true,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 200,
    });
  }
}
