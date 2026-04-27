import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { ConversationEntity } from './conversation.entity';
import { MessagePhotoEntity } from './message-photo.entity';

@Entity('messages')
export class MessageEntity extends BaseEntity {
  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  conversation!: ConversationEntity;

  @ManyToOne(() => UserEntity, { eager: true, onDelete: 'CASCADE' })
  sender!: UserEntity;

  @Column('text')
  content!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt!: Date | null;

  @OneToMany(() => MessagePhotoEntity, (photo) => photo.message, {
    cascade: true,
  })
  photos!: MessagePhotoEntity[];
}
