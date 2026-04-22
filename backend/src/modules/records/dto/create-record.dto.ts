import { IsString, IsUUID } from 'class-validator';

export class CreateRecordDto {
  @IsString()
  plates!: string;

  @IsString()
  brand!: string;

  @IsString()
  type!: string;

  @IsString()
  useType!: string;

  @IsString()
  vehicleClass!: string;

  @IsString()
  model!: string;

  @IsString()
  engineNumber!: string;

  @IsString()
  serialNumber!: string;

  @IsString()
  custodian!: string;

  @IsString()
  patrolNumber!: string;

  @IsString()
  physicalStatus!: string;

  @IsString()
  status!: string;

  @IsString()
  assetClassification!: string;

  @IsString()
  observation!: string;

  @IsUUID()
  delegationId!: string;
}
