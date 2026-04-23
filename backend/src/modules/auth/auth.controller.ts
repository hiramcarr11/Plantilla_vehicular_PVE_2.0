import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from 'src/common/auth/current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

type AuthUser = {
  sub: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() request: Request) {
    const ipAddress = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    return this.authService.login(dto.email, dto.password, ipAddress);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findCurrentUser(@CurrentUser() user: AuthUser) {
    return this.authService.findCurrentUser(user.sub);
  }
}
