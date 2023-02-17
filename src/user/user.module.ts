import { Module } from '@nestjs/common';
import { StorageModule } from '@src/storage/storage.module';
import { VerificationModule } from '@src/verification/verification.module';
import { PersonProfileRepository } from './table/person-profile.repository';
import { UserController } from './user.controller';
import { UserRepository } from './table/user.repository';
import { UserService } from './user.service';
import { UserExistsByEmailValidator } from './validator/user-exists-by-email.validator';
import { UserExistsByPhoneNumberValidator } from './validator/user-exists-by-phone-number.validator';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { EnterpriseProfileRepository } from './table/enterprise-profile.repository';
import { CountryExistsByNameValidator } from './validator/country-exists-by-name.validator';
import { ShareholderRepository } from './table/shareholder.repository';
import { ReferralIdExistsValidator } from './validator/referral-id-exists.validator';
import { CountryModule } from '@src/country/country.module';
import { DocumentModule } from '@src/document/document.module';

@Module({
  imports: [
    VerificationModule,
    StorageModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('jwtConfig.secret'),
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
    CountryModule,
    DocumentModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserExistsByEmailValidator,
    UserExistsByPhoneNumberValidator,
    CountryExistsByNameValidator,
    PersonProfileRepository,
    EnterpriseProfileRepository,
    ShareholderRepository,
    ReferralIdExistsValidator,
  ],
  exports: [UserService],
})
export class UserModule {}
