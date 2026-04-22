import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/auth/current-user.decorator';
import { RequireRoles } from 'src/common/auth/roles.decorator';
import { RolesGuard } from 'src/common/auth/roles.guard';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type AuthUser = {
  sub: string;
};

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(Role.SuperAdmin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.create(dto, user.sub);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(id, dto, user.sub);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.softDelete(id, user.sub);
  }
}
