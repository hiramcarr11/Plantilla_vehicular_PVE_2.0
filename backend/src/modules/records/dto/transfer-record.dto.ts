import { IsString, IsUUID } from 'class-validator';

export class TransferRecordDto {
  @IsUUID()
  delegationId!: string;

  @IsString()
  reason!: string;
}
