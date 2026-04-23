import { IsOptional, IsString } from 'class-validator';

export class UpdateRecordDto {
  @IsOptional()
  @IsString()
  plates?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  useType?: string;

  @IsOptional()
  @IsString()
  vehicleClass?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  engineNumber?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  custodian?: string;

  @IsOptional()
  @IsString()
  patrolNumber?: string;

  @IsOptional()
  @IsString()
  physicalStatus?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  assetClassification?: string;

  @IsOptional()
  @IsString()
  observation?: string;
}
