import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { RecordEntity } from './record.entity';

@Entity('vehicle_transfers')
export class VehicleTransferEntity extends BaseEntity {
  @Column({ type: 'text', default: '' })
  reason!: string;

  @Column({ type: 'timestamp' })
  movedAt!: Date;

  @ManyToOne(() => RecordEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  record!: RecordEntity;

  @ManyToOne(() => DelegationEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  fromDelegation!: DelegationEntity;

  @ManyToOne(() => DelegationEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  toDelegation!: DelegationEntity;

  @ManyToOne(() => UserEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  movedBy!: UserEntity;
}
