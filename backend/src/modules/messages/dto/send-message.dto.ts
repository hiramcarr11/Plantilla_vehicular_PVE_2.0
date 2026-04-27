import { IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID('4')
  conversationId!: string;

  @IsString()
  content!: string;
}
