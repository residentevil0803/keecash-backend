import { Module } from '@nestjs/common';
import { VerificationModule } from '@src/verification/verification.module';
import { PersonProfile } from './person-profile.entity';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserExistsByEmailValidator } from './validator/user-exists-by-email.validator';
import { UserExistsByPhoneNumberValidator } from './validator/user-exists-by-phone-number.validator';

@Module({
  imports: [VerificationModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserExistsByEmailValidator,
    UserExistsByPhoneNumberValidator,
    PersonProfile,
  ],
  exports: [UserService],
})
export class UserModule {}
