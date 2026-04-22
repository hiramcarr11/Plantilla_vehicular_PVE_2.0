import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/auth/current-user.decorator';
import { RequireRoles } from 'src/common/auth/roles.decorator';
import { RolesGuard } from 'src/common/auth/roles.guard';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { CreateRecordDto } from './dto/create-record.dto';
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

  @Get('region/live')
  @RequireRoles(Role.RegionalManager)
  findRegionalView(@CurrentUser() user: AuthUser) {
    return this.recordsService.findRegionalView(user.regionId ?? '');
  }

  @Get('admin/overview')
  @RequireRoles(Role.Admin, Role.SuperAdmin)
  findAdminView() {
    return this.recordsService.findAdminView();
  }

  @Delete(':id')
  @RequireRoles(Role.Admin, Role.SuperAdmin)
  softDelete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.recordsService.softDelete(id, user);
  }
}
