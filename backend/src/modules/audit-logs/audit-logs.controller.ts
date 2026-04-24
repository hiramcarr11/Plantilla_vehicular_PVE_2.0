import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PaginatedQueryDto } from 'src/common/dto/paginated-query.dto';
import { RequireRoles } from 'src/common/auth/roles.decorator';
import { RolesGuard } from 'src/common/auth/roles.guard';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(Role.SuperAdmin)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get('live')
  findAll(@Query() query: PaginatedQueryDto) {
    const hasPagination = query.page !== undefined || query.limit !== undefined;

    if (hasPagination) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 100;
      return this.auditLogsService.findAll(page, limit);
    }

    return this.auditLogsService.findAll();
  }
}
