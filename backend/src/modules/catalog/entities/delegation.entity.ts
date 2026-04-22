import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { RecordEntity } from 'src/modules/records/entities/record.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { RegionEntity } from './region.entity';

@Entity('delegations')
export class DelegationEntity extends BaseEntity {
  @Column()
  name!: string;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => RegionEntity, (region) => region.delegations, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  region!: RegionEntity;

  @OneToMany(() => UserEntity, (user) => user.delegation)
  users!: UserEntity[];

  @OneToMany(() => RecordEntity, (record) => record.delegation)
  records!: RecordEntity[];
}
