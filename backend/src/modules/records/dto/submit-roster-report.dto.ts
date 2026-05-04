import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SubmitRosterReportDto {
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
