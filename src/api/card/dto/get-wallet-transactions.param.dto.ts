import { FiatCurrencyEnum } from '@api/transaction/transaction.types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class GetWalletTransactionsParamDto {
  @ApiProperty({ description: 'Fiat currency name', example: FiatCurrencyEnum.EUR, required: true })
  @IsEnum(FiatCurrencyEnum)
  currency: FiatCurrencyEnum;
}
