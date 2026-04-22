import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@Entity('audit_logs')
export class AuditLogEntity extends BaseEntity {
  @Column()
  action!: string;

  @Column()
  entityType!: string;

  @Column()
  entityId!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @ManyToOne(() => UserEntity, (user) => user.auditLogs, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  actor!: UserEntity | null;
}
