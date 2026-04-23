import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/auth/current-user.decorator';
import { RequireRoles } from 'src/common/auth/roles.decorator';
import { RolesGuard } from 'src/common/auth/roles.guard';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { CreateRecordDto } from './dto/create-record.dto';
import { SubmitRosterReportDto } from './dto/submit-roster-report.dto';
import { TransferRecordDto } from './dto/transfer-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { RecordsService } from './records.service';

type AuthUser = {
  sub: string;
  role: Role;
  regionId: string | null;
  delegationId: string | null;
};

@Controller('records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @RequireRoles(Role.Capturist)
  create(@Body() dto: CreateRecordDto, @CurrentUser() user: AuthUser) {
    return this.recordsService.create(dto, user);
  }

  @Get('my')
  @RequireRoles(Role.Capturist)
  findMine(@CurrentUser() user: AuthUser) {
    return this.recordsService.findMine(user.sub);
  }

  @Get('reports/my')
  @RequireRoles(Role.Capturist)
  findMyRosterReports(@CurrentUser() user: AuthUser) {
    return this.recordsService.findMyRosterReports(user);
  }

  @Post('reports')
  @RequireRoles(Role.Capturist)
  submitRosterReport(@Body() dto: SubmitRosterReportDto, @CurrentUser() user: AuthUser) {
    return this.recordsService.submitRosterReport(dto, user);
  }

  @Get('reports/overview')
  @RequireRoles(Role.Admin, Role.SuperAdmin, Role.Director)
  findRosterReportOverview() {
    return this.recordsService.findRosterReportOverview();
  }

  @Get('region/live')
  @RequireRoles(Role.RegionalManager)
  findRegionalView(@CurrentUser() user: AuthUser) {
    return this.recordsService.findRegionalView(user.regionId ?? '');
  }

  @Get('admin/overview')
  @RequireRoles(Role.Admin, Role.SuperAdmin)
  findAdminView(
    @Query('regionId') regionId?: string,
    @Query('delegationId') delegationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.recordsService.findAdminView(regionId, delegationId, dateFrom, dateTo);
  }

  @Get('director/overview')
  @RequireRoles(Role.Director, Role.Admin, Role.SuperAdmin)
  findDirectorOverview(
    @Query('regionId') regionId?: string,
    @Query('delegationId') delegationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.recordsService.findDirectorOverview(regionId, delegationId, dateFrom, dateTo);
  }

  @Delete(':id')
  @RequireRoles(Role.Admin, Role.SuperAdmin)
  softDelete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.recordsService.softDelete(id, user);
  }

  @Patch(':id')
  @RequireRoles(Role.Capturist, Role.Admin, Role.SuperAdmin)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recordsService.update(id, dto, user);
  }

  @Post(':id/transfer')
  @RequireRoles(Role.Admin, Role.SuperAdmin)
  transfer(
    @Param('id') id: string,
    @Body() dto: TransferRecordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recordsService.transfer(id, dto, user);
  }
}
