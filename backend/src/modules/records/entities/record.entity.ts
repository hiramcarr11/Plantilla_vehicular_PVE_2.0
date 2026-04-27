import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { VehiclePhotoEntity } from './vehicle-photo.entity';

@Entity('records')
export class RecordEntity extends BaseEntity {
  @Column()
  plates!: string;

  @Column()
  brand!: string;

  @Column()
  type!: string;

  @Column()
  useType!: string;

  @Column()
  vehicleClass!: string;

  @Column()
  model!: string;

  @Column()
  engineNumber!: string;

  @Column()
  serialNumber!: string;

  @Column()
  custodian!: string;

  @Column()
  patrolNumber!: string;

  @Column()
  physicalStatus!: string;

  @Column()
  status!: string;

  @Column()
  assetClassification!: string;

  @Column({ type: 'text', default: '' })
  observation!: string;

  @ManyToOne(() => DelegationEntity, (delegation) => delegation.records, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  delegation!: DelegationEntity;

  @ManyToOne(() => UserEntity, (user) => user.createdRecords, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  createdBy!: UserEntity;

  @OneToMany(() => VehiclePhotoEntity, (photo) => photo.record, {
    cascade: true,
  })
  photos!: VehiclePhotoEntity[];
}
