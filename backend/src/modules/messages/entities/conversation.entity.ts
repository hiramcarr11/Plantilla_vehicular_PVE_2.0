import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { MessageEntity } from './message.entity';

@Entity('conversations')
export class ConversationEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  title!: string | null;

  @Column({ default: false })
  isGroup!: boolean;

  @ManyToMany(() => UserEntity)
  @JoinTable({
    name: 'conversation_participants_user',
    joinColumn: { name: 'conversationId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  participants!: UserEntity[];

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages!: MessageEntity[];

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt!: Date | null;
}
