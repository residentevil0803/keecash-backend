import { IsEnum, IsNumber, IsString } from 'class-validator';
import { FiatCurrencyEnum } from '@api/transaction/transaction.types';

export class FundBridgecardDto {
  @IsString()
  card_id: string;

  @IsNumber()
  amount: number;

  @IsString()
  transaction_reference: string;

  @IsEnum(FiatCurrencyEnum)
  currency: FiatCurrencyEnum;
}
