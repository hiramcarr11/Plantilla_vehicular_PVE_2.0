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
  @RequireRoles(Role.Enlace)
  create(@Body() dto: CreateRecordDto, @CurrentUser() user: AuthUser) {
    return this.recordsService.create(dto, user);
  }

  @Get('my')
  @RequireRoles(Role.Enlace)
  findMine(@CurrentUser() user: AuthUser) {
    return this.recordsService.findMine(user);
  }

  @Get('reports/my')
  @RequireRoles(Role.Enlace)
  findMyRosterReports(@CurrentUser() user: AuthUser) {
    return this.recordsService.findMyRosterReports(user);
  }

  @Get('reports/region/my')
  @RequireRoles(Role.DirectorOperativo)
  findMyRegionalRosterReports(@CurrentUser() user: AuthUser) {
    return this.recordsService.findMyRegionalRosterReports(user);
  }

  @Post('reports')
  @RequireRoles(Role.Enlace)
  submitRosterReport(@Body() dto: SubmitRosterReportDto, @CurrentUser() user: AuthUser) {
    return this.recordsService.submitRosterReport(dto, user);
  }

  @Post('reports/region')
  @RequireRoles(Role.DirectorOperativo)
  submitRegionalRosterReport(@Body() dto: SubmitRosterReportDto, @CurrentUser() user: AuthUser) {
    return this.recordsService.submitRegionalRosterReport(dto, user);
  }

  @Get('reports/overview')
  @RequireRoles(Role.PlantillaVehicular, Role.SuperAdmin, Role.DirectorGeneral, Role.Coordinacion, Role.DirectorOperativo)
  findRosterReportOverview(
    @Query('regionId') regionId?: string,
  ) {
    return this.recordsService.findRosterReportOverview(regionId);
  }

  @Get('reports/region/overview')
  @RequireRoles(Role.DirectorOperativo)
  findRegionalRosterReportOverview(
    @CurrentUser() user: AuthUser,
    @Query('delegationId') delegationId?: string,
  ) {
    return this.recordsService.findRegionalRosterReportOverview(user, delegationId);
  }

  @Get('region/live')
  @RequireRoles(Role.DirectorOperativo)
  findRegionalView(@CurrentUser() user: AuthUser) {
    return this.recordsService.findRegionalView(user);
  }

  @Get('admin/overview')
  @RequireRoles(Role.PlantillaVehicular, Role.SuperAdmin, Role.Coordinacion, Role.DirectorOperativo)
  findAdminView(
    @Query('regionId') regionId?: string,
    @Query('delegationId') delegationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.recordsService.findAdminView(regionId, delegationId, dateFrom, dateTo);
  }

  @Get('director/overview')
  @RequireRoles(Role.DirectorGeneral, Role.PlantillaVehicular, Role.SuperAdmin, Role.Coordinacion, Role.DirectorOperativo)
  findDirectorOverview(
    @Query('regionId') regionId?: string,
    @Query('delegationId') delegationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.recordsService.findDirectorOverview(regionId, delegationId, dateFrom, dateTo);
  }

  @Delete(':id')
  @RequireRoles(Role.PlantillaVehicular, Role.SuperAdmin, Role.Coordinacion)
  softDelete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.recordsService.softDelete(id, user);
  }

  @Patch(':id')
  @RequireRoles(Role.Enlace, Role.PlantillaVehicular, Role.SuperAdmin, Role.Coordinacion, Role.DirectorOperativo)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recordsService.update(id, dto, user);
  }

  @Post(':id/transfer')
  @RequireRoles(Role.Enlace, Role.DirectorOperativo, Role.PlantillaVehicular, Role.SuperAdmin, Role.Coordinacion)
  transfer(
    @Param('id') id: string,
    @Body() dto: TransferRecordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recordsService.transfer(id, dto, user);
  }
}
