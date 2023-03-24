import { Module } from '@nestjs/common';
import { UserModule } from '@api/user/user.module';
import { AuthModule } from '@api/auth/auth.module';
import { AuthRefreshTokenModule } from '@api/auth-refresh-token/auth-refresh-token.module';
import { VerificationModule } from '@api/verification/verification.module';
import { StorageModule } from '@api/storage/storage.module';
import { CryptoTxModule } from '@api/crypto-tx/crypto-tx.module';
import { BeneficiaryModule } from '@api/beneficiary/beneficiary.module';
import { CountryModule } from '@api/country/country.module';
import { DocumentModule } from '@api/user/document/document.module';
import { EnterpriseProfileModule } from '@api/user/enterprise-profile/enterprise-profile.module';
import { PersonProfileModule } from '@api/user/person-profile/person-profile.module';
import { ShareholderModule } from '@api/shareholder/shareholder.module';
import { CountryActivationModule } from '@api/country/country-activation/country-activation.module';
import { CountryFeeModule } from '@api/country/country-fee/country-fee.module';
import { BeneficiaryUserModule } from '@api/beneficiary/beneficiary-user/beneficiary-user.module';
import { BeneficiaryWalletModule } from '@api/beneficiary/beneficiary-wallet/beneficiary-wallet.module';
import { CardModule } from '@api/card/card.module';
import { TransactionModule } from '@api/transaction/transaction.module';

@Module({
  imports: [
    AuthModule,
    AuthRefreshTokenModule,
    StorageModule,
    CryptoTxModule,
    ShareholderModule,
    CardModule,
    TransactionModule,
    UserModule,
    PersonProfileModule,
    EnterpriseProfileModule,
    DocumentModule,
    BeneficiaryModule,
    BeneficiaryUserModule,
    BeneficiaryWalletModule,
    CountryModule,
    CountryActivationModule,
    CountryFeeModule,
    VerificationModule,
  ],
})
export class PublicSubModule {}