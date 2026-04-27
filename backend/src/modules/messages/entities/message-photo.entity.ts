import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { MessageEntity } from 'src/modules/messages/entities/message.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@Entity('message_photos')
export class MessagePhotoEntity extends BaseEntity {
  @Column()
  fileName!: string;

  @Column()
  filePath!: string;

  @Column()
  mimeType!: string;

  @ManyToOne(() => MessageEntity, (message) => message.photos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  message!: MessageEntity;

  @ManyToOne(() => UserEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  uploadedBy!: UserEntity;
}
