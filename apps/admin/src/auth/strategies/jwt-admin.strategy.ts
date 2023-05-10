import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminAccessTokenInterface } from '../admin-auth.type';
import { Admin } from '@admin/admin/admin.entity';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwtAdmin') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwtConfig.secret'),
    });
  }

  async validate(payload: Partial<Admin>): Promise<AdminAccessTokenInterface> {
    return {
      id: payload.id,
      email: payload.email,
      type: payload.type,
    };
  }
}
