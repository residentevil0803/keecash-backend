import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@app/user';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({ usernameField: 'emailOrPhoneNumber' });
  }

  async validate(emailOrPhoneNumber: string, password: string): Promise<User> {
    const validatedUser = await this.authService.validateUserByPassword(
      emailOrPhoneNumber,
      password,
    );

    if (!validatedUser) throw new UnauthorizedException('Username and password does not match');

    return validatedUser;
  }
}
