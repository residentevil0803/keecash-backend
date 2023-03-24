import { Module } from '@nestjs/common';
import { CardController } from './card.controller';
import { CardRepository } from './card.repository';
import { CardService } from './card.service';
import { TransactionModule } from '@api/transaction/transaction.module';
import { TransferController } from './transfer.controller';
import { DepositController } from './deposit.controller';
import { WithdrawalController } from './withdrawal.controller';

@Module({
  imports: [TransactionModule],
  controllers: [CardController, DepositController, WithdrawalController, TransferController],
  providers: [CardService, CardRepository],
  exports: [CardService],
})
export class CardModule {}
