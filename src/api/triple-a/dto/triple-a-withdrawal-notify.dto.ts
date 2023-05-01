import { FiatCurrencyEnum } from '@api/transaction/transaction.types';

export class TripleAWithdrawalNotifyDto {
  payout_reference: string;

  order_id: string;

  local_currency: FiatCurrencyEnum;
}