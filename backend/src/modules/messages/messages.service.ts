import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { AuditLogsService } from 'src/modules/audit-logs/audit-logs.service';
import { RealtimeGateway } from 'src/modules/realtime/realtime.gateway';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { MessagePhotoEntity } from './entities/message-photo.entity';

type UploadedFile = {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
};

const ALLOWED_ROLES = [Role.Enlace, Role.PlantillaVehicular, Role.Coordinacion];

type AuthUser = {
  sub: string;
  role: Role;
};

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(MessagePhotoEntity)
    private readonly messagePhotoRepository: Repository<MessagePhotoEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly auditLogsService: AuditLogsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async createConversation(dto: CreateConversationDto, authUser: AuthUser) {
    this.validateRoleAccess(authUser.role);

    const participants = await this.userRepository.findBy({ id: In(dto.participantIds) });

    if (participants.length !== dto.participantIds.length) {
      throw new NotFoundException('One or more participants not found.');
    }

    const creator = await this.userRepository.findOneBy({ id: authUser.sub });
    if (!creator) {
      throw new NotFoundException('Authenticated user not found.');
    }

    if (!participants.some((p) => p.id === authUser.sub)) {
      participants.push(creator);
    }

    const participantIds = participants.map((p) => p.id);
    const existingConversation = await this.findExistingDirectConversation(participantIds);

    if (existingConversation) {
      return this.findOneConversation(existingConversation.id);
    }

    const conversation = this.conversationRepository.create({
      title: dto.title ?? null,
      isGroup: participants.length > 2,
      participants,
      lastMessageAt: new Date(),
    });

    const savedConversation = await this.conversationRepository.save(conversation);

    await this.auditLogsService.register({
      actorId: authUser.sub,
      action: 'CONVERSATION_CREATED',
      entityType: 'conversation',
      entityId: savedConversation.id,
      metadata: {
        participantIds,
        isGroup: participants.length > 2,
      },
    });

    const hydratedConversation = await this.findOneConversation(savedConversation.id);

    this.realtimeGateway.emitConversationCreated(hydratedConversation);

    return hydratedConversation;
  }

  async getMessagingPartners(authUser: AuthUser) {
    this.validateRoleAccess(authUser.role);

    return this.userRepository.find({
      where: {
        role: In([Role.Enlace, Role.PlantillaVehicular, Role.Coordinacion]),
        isActive: true,
      },
      order: { firstName: 'ASC' },
    });
  }

  async getMyConversations(authUser: AuthUser) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .leftJoinAndSelect('conversation.messages', 'latestMessage')
      .leftJoinAndSelect('latestMessage.sender', 'sender')
      .where('participants.id = :userId', { userId: authUser.sub })
      .orderBy('conversation.lastMessageAt', 'DESC')
      .getMany();

    return conversations.map((conv) => ({
      ...conv,
      unreadCount: conv.messages?.filter(
        (m) => m.sender?.id !== authUser.sub && !m.isRead,
      ).length ?? 0,
      lastMessage: conv.messages?.[conv.messages.length - 1] ?? null,
    }));
  }

  async getConversationMessages(conversationId: string, authUser: AuthUser) {
    const conversation = await this.findOneConversation(conversationId);

    this.validateConversationAccess(conversation, authUser.sub);

    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      relations: { sender: true, photos: { uploadedBy: true } },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(dto: SendMessageDto, authUser: AuthUser, photos?: UploadedFile[]) {
    const conversation = await this.findOneConversation(dto.conversationId);

    this.validateConversationAccess(conversation, authUser.sub);

    const sender = await this.userRepository.findOneBy({ id: authUser.sub });

    if (!sender) {
      throw new NotFoundException('User not found.');
    }

    const message = await this.messageRepository.save(
      this.messageRepository.create({
        conversation,
        sender,
        content: dto.content.trim(),
        isRead: false,
      }),
    );

    if (photos && photos.length > 0) {
      const photoEntities = photos.map((photo) =>
        this.messagePhotoRepository.create({
          fileName: photo.originalname,
          filePath: photo.filename,
          mimeType: photo.mimetype,
          message,
          uploadedBy: sender,
        }),
      );
      await this.messagePhotoRepository.save(photoEntities);
    }

    conversation.lastMessageAt = new Date();
    await this.conversationRepository.save(conversation);

    const hydratedMessage = await this.findOneMessage(message.id);

    await this.auditLogsService.register({
      actorId: authUser.sub,
      action: 'MESSAGE_SENT',
      entityType: 'message',
      entityId: message.id,
      metadata: {
        conversationId: dto.conversationId,
        recipientIds: conversation.participants
          .filter((p) => p.id !== authUser.sub)
          .map((p) => p.id),
        photoCount: photos?.length ?? 0,
      },
    });

    const recipientIds = conversation.participants
      .filter((p) => p.id !== authUser.sub)
      .map((p) => p.id);

    this.realtimeGateway.emitMessageSent(hydratedMessage, recipientIds);

    return hydratedMessage;
  }

  async markMessageAsRead(dto: MarkReadDto, authUser: AuthUser) {
    const message = await this.messageRepository.findOne({
      where: { id: dto.messageId },
      relations: { conversation: { participants: true }, sender: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    this.validateConversationAccess(message.conversation, authUser.sub);

    if (message.sender.id === authUser.sub) {
      throw new ForbiddenException('Cannot mark your own message as read.');
    }

    message.isRead = true;
    message.readAt = new Date();
    await this.messageRepository.save(message);

    this.realtimeGateway.emitMessageRead(message, [message.sender.id]);

    return message;
  }

  async markAllConversationAsRead(conversationId: string, authUser: AuthUser) {
    const conversation = await this.findOneConversation(conversationId);

    this.validateConversationAccess(conversation, authUser.sub);

    await this.messageRepository
      .createQueryBuilder()
      .update(MessageEntity)
      .set({ isRead: true, readAt: new Date() })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId: authUser.sub })
      .andWhere('isRead = false')
      .execute();

    this.realtimeGateway.emitConversationRead(conversationId, [authUser.sub]);
  }

  async findOneConversation(id: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return conversation;
  }

  private async findOneMessage(id: string) {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: { conversation: { participants: true }, sender: true, photos: { uploadedBy: true } },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    return message;
  }

  private async findExistingDirectConversation(participantIds: string[]) {
    if (participantIds.length !== 2) {
      return null;
    }

    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .where('conversation.isGroup = :isGroup', { isGroup: false })
      .andWhere('participants.id IN (:...ids)', { ids: participantIds })
      .getMany();

    for (const conv of conversations) {
      const convParticipantIds = conv.participants.map((p) => p.id);
      if (
        convParticipantIds.length === 2 &&
        participantIds.every((id) => convParticipantIds.includes(id))
      ) {
        return conv;
      }
    }

    return null;
  }

  private validateRoleAccess(role: Role) {
    if (!ALLOWED_ROLES.includes(role)) {
      throw new ForbiddenException(
        'Your role does not have permission to use messaging.',
      );
    }
  }

  private validateConversationAccess(conversation: ConversationEntity, userId: string) {
    const isParticipant = conversation.participants.some((p) => p.id === userId);

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation.',
      );
    }
  }
}
