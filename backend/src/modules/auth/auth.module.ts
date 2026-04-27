import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLogsModule } from 'src/modules/audit-logs/audit-logs.module';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        const jwtExpiresIn = configService.get<string>('JWT_EXPIRES_IN', '8h');

        const knownInsecureSecrets = [
          'change_me',
          'secret',
          'jwt_secret',
          'changeme',
          'password',
          'replace_with_a_long_random_secret',
          'change_this_to_a_long_random_secret_at_least_16_chars',
        ];

        if (!jwtSecret || knownInsecureSecrets.includes(jwtSecret) || jwtSecret.length < 16) {
          throw new Error(
            'JWT_SECRET must be configured with a strong secret (minimum 16 characters, not a common placeholder).',
          );
        }

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '8h') as never,
          },
        };
      },
    }),
    UsersModule,
    AuditLogsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
