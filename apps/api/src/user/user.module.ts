import { Module } from '@nestjs/common';
import { TwilioModule } from '@app/twilio';
import { CountryModule } from '@app/country';
import { SumsubModule } from '@app/sumsub';
import { UserSubscriber } from '@app/user';
import { PersonProfileModule } from '@app/person-profile';
import { ClosureReasonModule } from '@app/closure-reason';
import { BridgecardModule } from '@app/bridgecard';
import { OutboxModule } from '@app/outbox';
import { TransactionModule } from '@api/transaction/transaction.module';
import { CardModule } from '@api/card/card.module';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserExistsByEmailValidator } from './validator/user-exists-by-email.validator';
import { UserExistsByPhoneNumberValidator } from './validator/user-exists-by-phone-number.validator';
import { CountryExistsByNameValidator } from './validator/country-exists-by-name.validator';
import { ReferralIdExistsValidator } from './validator/referral-id-exists.validator';
import { LegitEmailValidator } from './validator/legit-email.validator';

@Module({
  imports: [
    TwilioModule,
    CountryModule,
    PersonProfileModule,
    ClosureReasonModule,
    TransactionModule,
    CardModule,
    BridgecardModule,
    SumsubModule,
    OutboxModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserSubscriber,
    UserExistsByEmailValidator,
    UserExistsByPhoneNumberValidator,
    CountryExistsByNameValidator,
    ReferralIdExistsValidator,
    LegitEmailValidator,
  ],
  exports: [UserService],
})
export class UserModule {}
