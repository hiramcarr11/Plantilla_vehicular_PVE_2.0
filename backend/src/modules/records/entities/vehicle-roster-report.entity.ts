import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@Entity('vehicle_roster_reports')
export class VehicleRosterReportEntity extends BaseEntity {
  @Column({ default: false })
  hasChanges!: boolean;

  @Column({ type: 'int', default: 0 })
  changesSinceLastReport!: number;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ type: 'timestamp' })
  submittedAt!: Date;

  @ManyToOne(() => DelegationEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  delegation!: DelegationEntity;

  @ManyToOne(() => UserEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  submittedBy!: UserEntity;
}
