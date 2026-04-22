import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { DelegationEntity } from './delegation.entity';

@Entity('regions')
export class RegionEntity extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @OneToMany(() => DelegationEntity, (delegation) => delegation.region)
  delegations!: DelegationEntity[];
}
