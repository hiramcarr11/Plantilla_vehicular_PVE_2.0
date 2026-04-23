import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { RegionEntity } from 'src/modules/catalog/entities/region.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

export type VehicleRosterReportScope = 'DELEGATION' | 'REGION';

@Entity('vehicle_roster_reports')
export class VehicleRosterReportEntity extends BaseEntity {
  @Column({ type: 'varchar', default: 'DELEGATION' })
  reportScope!: VehicleRosterReportScope;

  @Column({ default: false })
  hasChanges!: boolean;

  @Column({ type: 'int', default: 0 })
  changesSinceLastReport!: number;

  @Column({ type: 'int', default: 0 })
  confirmedDelegationReports!: number;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ type: 'timestamp' })
  submittedAt!: Date;

  @ManyToOne(() => DelegationEntity, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  delegation!: DelegationEntity | null;

  @ManyToOne(() => RegionEntity, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  region!: RegionEntity | null;

  @ManyToOne(() => UserEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  submittedBy!: UserEntity;
}
