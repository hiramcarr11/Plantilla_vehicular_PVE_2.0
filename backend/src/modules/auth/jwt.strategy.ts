import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

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

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
