import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuditLogsService } from 'src/modules/audit-logs/audit-logs.service';
import { UsersService } from 'src/modules/users/users.service';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(normalizeEmail(email));

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      regionId: user.region?.id ?? user.delegation?.region?.id ?? null,
      delegationId: user.delegation?.id ?? null,
    };

    await this.auditLogsService.register({
      actorId: user.id,
      action: 'USER_LOGGED_IN',
      entityType: 'user',
      entityId: user.id,
      metadata: {
        email: user.email,
      },
    });

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: await this.usersService.findOne(user.id),
    };
  }
}
