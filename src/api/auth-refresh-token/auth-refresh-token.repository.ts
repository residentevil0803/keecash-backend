import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { randomBytes } from 'node:crypto';
import { User } from '@api/user/user.entity';
import { AuthRefreshToken } from './auth-refresh-token.entity';
import { RefreshTokenInfo } from '@api/auth/dto/refresh-token-info.dto';

@Injectable()
export class AuthRefreshTokenRepository extends Repository<AuthRefreshToken> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    super(AuthRefreshToken, dataSource.manager);
  }

  async createRefreshToken(
    user: Partial<User>,
    refreshTokenInfo: RefreshTokenInfo,
  ): Promise<AuthRefreshToken> {
    const refreshToken = this.create({
      userId: user.id,
      token: randomBytes(32).toString('hex'),
      userAgent: refreshTokenInfo.userAgent,
      ipAddress: refreshTokenInfo.ipAddress,
      expireAt: DateTime.now()
        .plus({
          days: this.configService.get('jwtConfig.refreshTokenDurationDays'),
        })
        .toJSDate(),
    });

    return this.save(refreshToken);
  }
}
