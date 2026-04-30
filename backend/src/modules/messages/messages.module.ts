import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogsModule } from "src/modules/audit-logs/audit-logs.module";
import { UserEntity } from "src/modules/users/entities/user.entity";
import { RealtimeModule } from "src/modules/realtime/realtime.module";
import { ConversationEntity } from "./entities/conversation.entity";
import { MessageEntity } from "./entities/message.entity";
import { MessagePhotoEntity } from "./entities/message-photo.entity";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";
import { StorageModule } from "src/modules/storage/storage.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      MessagePhotoEntity,
      UserEntity,
    ]),
    AuditLogsModule,
    RealtimeModule,
    StorageModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
