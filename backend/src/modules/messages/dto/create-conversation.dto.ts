import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds!: string[];

  @IsOptional()
  @IsString()
  title?: string;
}
