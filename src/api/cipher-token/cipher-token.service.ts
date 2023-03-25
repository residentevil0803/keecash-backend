import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenInfo } from '@api/auth/dto/refresh-token-info.dto';
import { User } from '@api/user/user.entity';
import { CipherToken } from './cipher-token.entity';
import { CipherTokenRepository } from './cipher-token.repository';

@Injectable()
export class CipherTokenService {
  constructor(private readonly cipherTokenRepository: CipherTokenRepository) {}

  async findOneBy(params: Partial<CipherToken>): Promise<CipherToken> {
    return this.cipherTokenRepository.findOneBy({ ...params });
  }

  async deleteByToken(token: string): Promise<boolean> {
    const deleteResult = await this.cipherTokenRepository.delete({ token });

    return deleteResult.affected === 1;
  }

  async createRefreshToken(
    user: Partial<User>,
    refreshTokenInfo: RefreshTokenInfo,
  ): Promise<CipherToken> {
    return this.cipherTokenRepository.createRefreshToken(user, refreshTokenInfo);
  }

  async createResetPasswordToken(userId: number): Promise<any> {
    return this.cipherTokenRepository.createResetPasswordToken(userId);
  }

  async checkIfValid(token: string): Promise<number> {
    const cipherToken = await this.cipherTokenRepository.findOneBy({ token });
    
    if (!cipherToken) {
      throw new UnauthorizedException('Token is invalid');
    }

    const expiryDate = new Date(cipherToken.expireAt);
    const now = new Date();

    if (expiryDate.getTime() < now.getTime()) {
      throw new UnauthorizedException('Token is expired');
    }

    return cipherToken.userId;
  }
}
