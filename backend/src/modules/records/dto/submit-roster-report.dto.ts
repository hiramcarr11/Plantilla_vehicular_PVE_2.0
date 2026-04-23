import { IsOptional, IsString } from 'class-validator';

export class SubmitRosterReportDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
