import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CardRepository } from './card.repository';
import { GetDepositFeeDto } from './dto/get-deposit-fee.dto';
import {
  FiatCurrencyEnum,
  TxTypeEnum,
  TransactionStatusEnum,
} from '@api/transaction/transaction.types';
import { GetWithdrawalFeeDto } from './dto/get-withdrawal-fee.dto';
import { GetTransferFeeDto } from './dto/get-transfer-fee.dto';
import { TransactionService } from '@api/transaction/transaction.service';
import { GetCreateCardTotalFeeDto } from './dto/get-create-card-total-fee.dto';
import { Card } from './card.entity';
import { CountryFeeService } from '@api/country-fee/country-fee.service';
import { UserService } from '@api/user/user.service';
import { CreateCardDto } from './dto/create-card.dto';
import { BridgecardService } from '@api/bridgecard/bridgecard.service';
import { CardBrandEnum, CardTypeEnum, CardUsageEnum } from './card.types';
import { BeneficiaryService } from '@api/beneficiary/beneficiary.service';
import { GetCardTopupSettingDto } from './dto/get-card-topup-setting.dto';
import { TripleADepositNotifyDto } from '@api/triple-a/dto/triple-a-deposit-notify.dto';
import { TripleAWithdrawalNotifyDto } from '@api/triple-a/dto/triple-a-withdrawal-notify.dto';
import { UserAccessTokenInterface } from '@api/auth/auth.type';
import { WithdrawalApplyDto } from './dto/withdrawal-apply.dto';
import { NotificationService } from '@api/notification/notification.service';
import { TripleAService } from '@api/triple-a/triple-a.service';
import { DepositPaymentLinkDto } from './dto/deposit-payment-link.dto';
import { NotificationType } from '@api/notification/notification.types';
import { TransferApplyDto } from './dto/transfer-apply.dto';
import { GetWalletTransactionsQueryDto } from './dto/get-wallet-transactions.query.dto';
import { ApplyCardTopupDto } from './dto/card-topup-apply.dto';
import { GetCardWithdrawalSettingDto } from './dto/get-card-withdrawal-setting.dto';
import { ApplyCardWithdrawalDto } from './dto/card-withdrawal-apply.dto';

@Injectable()
export class CardService {
  private readonly logger = new Logger(BridgecardService.name);

  constructor(
    private readonly cardRepository: CardRepository,
    private readonly transactionService: TransactionService,
    private readonly countryFeeService: CountryFeeService,
    private readonly bridgecardService: BridgecardService,
    private readonly beneficiaryService: BeneficiaryService,
    private readonly notificationService: NotificationService,
    private readonly tripleAService: TripleAService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}

  async findOne(param: Partial<Card>) {
    return this.cardRepository.findOne({ where: param });
  }

  async findAllPaginated(searchParams: any): Promise<any> {
    return;
    // return this.getPaginatedQueryBuilder({ ...searchParams, userId });
  }

  async create(data: Partial<Card>) {
    const cardEntity = await this.cardRepository.create(data);

    return this.cardRepository.save(cardEntity);
  }

  async delete(param: Partial<Card>): Promise<boolean> {
    const { affected } = await this.cardRepository.softDelete(param);

    if (affected) return true;
    else return false;
  }

  // -------------- MANAGE CARD -------------------

  async getDashboardItemsByUserId(userId: number): Promise<any> {
    const walletBalance = await this.transactionService.getWalletBalances(userId);

    const transactions = await this.transactionService
      .findManyByFilter(userId, null, {})
      .then((res) =>
        res.map((tx) => ({
          amount: Math.abs(tx.affectedAmount),
          currency: tx.currency,
          date: tx.createdAt,
          to: '',
          type: tx.affectedAmount > 0 ? 'income' : 'outgoing',
        })),
      );

    const { cardholderId, cardholderVerified } = await this.userService.findOne({ id: userId });

    let eurCards = [];
    let usdCards = [];

    if (cardholderId && cardholderVerified) {
      const cards = await this.bridgecardService.getAllCardholderCards(cardholderId);

      eurCards = cards
        .filter(({ card_currency }) => card_currency === FiatCurrencyEnum.EUR)
        .map((card) => ({
          cardId: card.card_id,
          balance: card.balance,
          currency: card.card_currency,
          cardNumber: card.card_number,
          name: card.meta_data.keecash_card_name,
          date: {
            expiry_month: card.expiry_month,
            expiry_year: card.expiry_year,
          },
        }));
      usdCards = cards
        .filter(({ card_currency }) => card_currency === FiatCurrencyEnum.USD)
        .map((card) => ({
          cardId: card.card_id,
          balance: card.balance,
          currency: card.card_currency,
          cardNumber: card.card_number,
          name: card.meta_data.keecash_card_name,
          date: `${card.expiry_month < 10 && '0' + card.expiry_month}/${card.expiry_year.slice(
            -2,
          )}`,
        }));
    }

    return {
      wallets: [
        {
          balance: walletBalance.eur,
          currency: FiatCurrencyEnum.EUR,
          cards: eurCards,
        },
        {
          balance: walletBalance.usd,
          currency: FiatCurrencyEnum.USD,
          cards: usdCards,
        },
      ],
      recommended: FiatCurrencyEnum.EUR,
      transactions,
    };
  }

  async getCardListByUserId(userId: number): Promise<any> {
    const { cardholderId } = await this.userService.findOne({ id: userId });

    const cards = await this.bridgecardService.getAllCardholderCards(cardholderId);

    const details = await Promise.all(
      cards.map(async (card) => {
        const balancePromise = this.bridgecardService.getCardBalance(card.card_id);
        const transactionsPromise = this.bridgecardService.getCardTransactions(card.card_id);

        const [balance, transactions] = await Promise.all([balancePromise, transactionsPromise]);

        return {
          balance,
          lastTransaction: transactions.transactions && {
            amount: transactions.transactions[0].amount,
            date: transactions.transactions[0].transaction_date, //2022-08-08 02:48:15
            image: '',
            to: transactions.transactions[0].description,
            type: '',
            currency: transactions.transactions[0].currency,
            from: '',
          },
        };
      }),
    );

    const result = cards.map((card, i) => ({
      bridgecardId: card.card_id,
      balance: details[i].balance,
      currency: card.card_currency,
      isBlock: !card.is_active,
      isExpired: new Date(`${card.expiry_year}-${card.expiry_month}-01`) < new Date(),
      cardNumber: card.card_number,
      name: card.meta_data.keecash_card_name,
      date: `${card.expiry_month}/${card.expiry_year.slice(-2)}`,
      cardholderName: card.card_name,
      lastTransaction: details[i].lastTransaction,
    }));

    return result;
  }

  async blockCard(userId: number, cardId: string): Promise<void> {
    const card = this.cardRepository.findOne({ where: { userId, bridgecardId: cardId } });

    if (!card) {
      throw new UnauthorizedException('Cannot find card with requested ID');
    }

    await this.bridgecardService.freezeCard(cardId);
  }

  async unlockCard(userId: number, cardId: string): Promise<void> {
    const card = this.cardRepository.findOne({ where: { userId, bridgecardId: cardId } });

    if (!card) {
      throw new UnauthorizedException('User does not have right to access the card');
    }

    await this.bridgecardService.unfreezeCard(cardId);
  }

  // -------------- DEPOSIT -------------------

  async getDepositFee(countryId: number, query: GetDepositFeeDto) {
    const { depositFixedFee, depositPercentFee } =
      await this.countryFeeService.findOneWalletDepositWithdrawalFee({
        countryId,
        currency: query.keecash_wallet,
        method: query.deposit_method,
      });

    const feesApplied = parseFloat(
      ((parseFloat(query.fiat_amount) * depositPercentFee) / 100 + depositFixedFee).toFixed(2),
    );
    const amountAfterFee = parseFloat(query.fiat_amount) + feesApplied;

    return {
      fix_fees: depositFixedFee,
      percent_fees: depositPercentFee,
      fees_applied: feesApplied,
      amount_after_fee: amountAfterFee,
    };
  }

  async getDepositPaymentLink(user: UserAccessTokenInterface, body: DepositPaymentLinkDto) {
    // Calculate fees
    const { depositFixedFee, depositPercentFee } =
      await this.countryFeeService.findOneWalletDepositWithdrawalFee({
        countryId: user.countryId,
        currency: body.keecash_wallet,
        method: body.deposit_method,
      });
    const feesApplied = parseFloat(
      ((body.desired_amount * depositPercentFee) / 100 + depositFixedFee).toFixed(2),
    );
    const amountAfterFee = body.desired_amount + feesApplied;

    // Trigger TripleA API
    const res = await this.tripleAService.deposit({
      amount: amountAfterFee,
      currency: body.keecash_wallet,
      email: user.email,
      keecashUserId: user.referralId,
    });

    // Create a deposit transaction
    await this.transactionService.create({
      userId: user.id,
      currency: body.keecash_wallet,
      affectedAmount: body.desired_amount,
      appliedFee: feesApplied,
      fixedFee: depositFixedFee,
      percentageFee: depositPercentFee,
      cryptoType: body.deposit_method,
      type: TxTypeEnum.Deposit,
      status: TransactionStatusEnum.InProgress, // TODO: set PERFORMED after webhook call
      description: `Deposited ${body.desired_amount} ${body.keecash_wallet} from ${body.deposit_method}`,
      reason: body.reason,
      tripleAPaymentReference: res.payment_reference,
    });

    // TODO: Add to Redis/BullMQ message queue asynchronously
    // Create a notification for the transaction
    await this.notificationService.create({
      userId: user.id,
      type: NotificationType.Deposit,
      amount: body.desired_amount,
      currency: body.keecash_wallet,
    });

    return {
      link: res.hosted_url,
    };
  }

  // -------------- WITHDRAWAL -------------------

  async getWithdrawalFee(countryId: number, query: GetWithdrawalFeeDto) {
    const { withdrawFixedFee, withdrawPercentFee } =
      await this.countryFeeService.findOneWalletDepositWithdrawalFee({
        countryId,
        currency: query.keecash_wallet,
        method: query.withdrawal_method,
      });

    const feesApplied = parseFloat(
      ((query.fiat_amount * withdrawPercentFee) / 100 + withdrawFixedFee).toFixed(2),
    );
    const amountAfterFee = query.fiat_amount - feesApplied;

    return {
      fix_fees: withdrawFixedFee,
      percent_fees: withdrawPercentFee,
      fees_applied: feesApplied,
      amount_after_fee: amountAfterFee,
    };
  }

  async applyWithdrawal(user: UserAccessTokenInterface, body: WithdrawalApplyDto) {
    // Check if user has enough balance
    const { balance } = await this.transactionService.getBalanceArrayByCurrency(
      user.id,
      body.keecash_wallet,
    );
    if (balance < body.target_amount) {
      throw new BadRequestException('Total pay amount exceeds current wallet balance');
    }

    // Add beneficiary user wallet
    if (body.to_save_as_beneficiary) {
      await this.beneficiaryService.createBeneficiaryWallet({
        userId: user.id,
        address: body.wallet_address,
        name: body.wallet_name,
        type: body.withdrawal_method,
      });
    }

    // Calculate fees
    const { withdrawFixedFee, withdrawPercentFee } =
      await this.countryFeeService.findOneWalletDepositWithdrawalFee({
        countryId: user.countryId,
        currency: body.keecash_wallet,
        method: body.withdrawal_method,
      });
    const feesApplied = parseFloat(
      ((body.target_amount * withdrawPercentFee) / 100 + withdrawFixedFee).toFixed(2),
    );
    const amountAfterFee = body.target_amount - feesApplied;

    // Trigger TripleA API
    const res = await this.tripleAService.withdraw({
      email: user.email,
      amount: amountAfterFee,
      cryptocurrency: body.withdrawal_method,
      currency: body.keecash_wallet,
      walletAddress: body.wallet_address,
      name: 'Keecash',
      country: 'FR',
      keecashUserId: user.referralId,
    });

    // Create a withdrawal transaction in database
    await this.transactionService.create({
      userId: user.id,
      currency: body.keecash_wallet,
      affectedAmount: -body.target_amount,
      appliedFee: feesApplied,
      fixedFee: withdrawFixedFee,
      percentageFee: withdrawPercentFee,
      cryptoType: body.withdrawal_method,
      type: TxTypeEnum.Withdrawal,
      status: TransactionStatusEnum.InProgress, // TODO: set PERFORMED after webhook call
      reason: body.reason,
      tripleAPaymentReference: res.payout_reference,
    });

    // TODO: Add to BullMQ
    // Create a notification for the transaction
    await this.notificationService.create({
      userId: user.id,
      type: NotificationType.Withdrawal,
      amount: body.target_amount,
      currency: body.keecash_wallet,
    });
  }

  // -------------- TRANSFER -------------------

  async getTransferFee(countryId: number, query: GetTransferFeeDto) {
    const { transferFixedFee, transferPercentFee } =
      await this.countryFeeService.findOneTransferReferralCardWithdrawalFee({
        countryId,
        currency: query.keecash_wallet,
      });

    const feesApplied = parseFloat(
      ((parseFloat(query.desired_amount) * transferPercentFee) / 100 + transferFixedFee).toFixed(2),
    );
    const amountAfterFee = parseFloat(query.desired_amount) - feesApplied;

    return {
      fix_fees: transferFixedFee,
      percent_fees: transferPercentFee,
      fees_applied: feesApplied,
      amount_to_receive: amountAfterFee,
    };
  }

  async applyTransfer(userId: number, countryId: number, body: TransferApplyDto) {
    // Check if user has enough balance
    const { balance } = await this.transactionService.getBalanceArrayByCurrency(
      userId,
      body.keecash_wallet,
    );
    if (balance < body.desired_amount) {
      throw new BadRequestException('Requested transfer amount exceeds current wallet balance');
    }

    // Calculate fees
    const { transferFixedFee, transferPercentFee } =
      await this.countryFeeService.findOneTransferReferralCardWithdrawalFee({
        countryId,
        currency: body.keecash_wallet,
      });
    const feesApplied = parseFloat(
      ((body.desired_amount * transferPercentFee) / 100 + transferFixedFee).toFixed(2),
    );
    const amountAfterFee = body.desired_amount - feesApplied;

    // Create 2 database transaction records for both sender and receiver
    await this.transactionService.createMany([
      {
        userId,
        receiverId: body.beneficiary_user_id,
        currency: body.keecash_wallet,
        affectedAmount: -body.desired_amount,
        appliedFee: feesApplied,
        fixedFee: transferFixedFee,
        percentageFee: transferPercentFee,
        type: TxTypeEnum.Transfer,
        status: TransactionStatusEnum.Performed, // TODO: Consider pending status in this transaction.
        description: `Transferred ${body.desired_amount} ${body.keecash_wallet}`,
        reason: body.reason,
      },
      {
        userId: body.beneficiary_user_id,
        senderId: userId,
        currency: body.keecash_wallet,
        affectedAmount: amountAfterFee,
        appliedFee: feesApplied,
        fixedFee: transferFixedFee,
        percentageFee: transferPercentFee,
        type: TxTypeEnum.Transfer,
        status: TransactionStatusEnum.Performed, // TODO: Consider pending status in this transaction.
        description: `Received ${amountAfterFee} ${body.keecash_wallet}`,
        reason: body.reason,
      },
    ]);

    // Add beneficiary user
    if (body.to_save_as_beneficiary) {
      await this.beneficiaryService.createBeneficiaryUser({
        payerId: userId,
        payeeId: body.beneficiary_user_id,
      });
    }

    // TODO: Add to BullMQ
    // Create notifications for the transaction
    await this.notificationService.create([
      {
        userId: userId,
        type: NotificationType.TransferSent,
        amount: body.desired_amount,
        currency: body.keecash_wallet,
      },
      {
        userId: body.beneficiary_user_id,
        type: NotificationType.TransferReceived,
        amount: body.desired_amount,
        currency: body.keecash_wallet,
      },
    ]);
  }

  // -------------- HISTORY -------------------

  async getWalletTransactions(
    userId: number,
    currency: FiatCurrencyEnum,
    query: GetWalletTransactionsQueryDto,
  ) {
    const transactions = await this.transactionService.findManyByFilter(userId, currency, query);

    return transactions;
  }

  // -------------- CREATE CARD -------------------

  async getCreateCardSettings(countryId: number, currency: FiatCurrencyEnum) {
    const cardPrices = await this.countryFeeService.findCardPrices({
      type: CardTypeEnum.Virtual, // Bridgecard provides VIRTUAL cards only
      countryId,
      currency,
    });

    const multipleCardPrice = cardPrices.find((price) => price.usage === CardUsageEnum.Multiple);
    const uniqueCardPrice = cardPrices.find((price) => price.usage === CardUsageEnum.Unique);

    if (!multipleCardPrice || !uniqueCardPrice) {
      throw new NotFoundException('Cannot find card prices for requested country');
    }

    const cardTypes = [
      {
        name: 'Multiple use card',
        type: CardUsageEnum.Multiple,
        description: 'Topped up multiple time',
        is_checked: true,
        price: multipleCardPrice.cardPrice,
        currency,
        cardValidity: '2 years',
      },
      {
        name: 'Single use card',
        type: CardUsageEnum.Unique,
        description: 'Topped up one time',
        is_checked: false,
        price: uniqueCardPrice.cardPrice,
        currency,
        cardValidity: '2 years',
      },
    ];

    return {
      cardTypes,
    };
  }

  async getFeesAppliedTotalToPay(userId: number, query: GetCreateCardTotalFeeDto) {
    const {
      personProfile: { countryId },
    } = await this.userService.findOneWithProfileAndDocuments({ id: userId }, true, false);

    const { cardTopUpPercentFee, cardTopUpFixedFee } =
      await this.countryFeeService.findOneCardTopupFee({
        countryId,
        currency: query.currency,
        usage: query.cardUsageType,
      });

    const feesApplied = parseFloat(
      ((parseFloat(query.desiredAmount) * cardTopUpPercentFee) / 100 + cardTopUpFixedFee).toFixed(
        2,
      ),
    );

    const { cardPrice } = await this.countryFeeService.findOneCardPrice({
      countryId,
      currency: query.currency,
      usage: query.cardUsageType,
      type: CardTypeEnum.Virtual, // Bridgecard provides VIRTUAL cards only
    });

    const totalToPay = cardPrice + parseFloat(query.desiredAmount) + feesApplied;

    return {
      fixedFee: cardTopUpFixedFee,
      percentageFee: cardTopUpPercentFee,
      feesApplied,
      cardPrice,
      totalToPay,
    };
  }

  async createCard(userId: number, countryId: number, body: CreateCardDto) {
    const { cardholderId, cardholderVerified } =
      await this.userService.findOneWithProfileAndDocuments({ id: userId }, true, false);

    if (!cardholderId || !cardholderVerified) {
      throw new BadRequestException('User is not registered in Bridgecard provider');
    }

    // Calculate price
    const { cardPrice } = await this.countryFeeService.findOneCardPrice({
      countryId,
      currency: body.keecashWallet,
      type: body.cardType,
      usage: body.cardUsage,
    });

    const { cardTopUpFixedFee, cardTopUpPercentFee } =
      await this.countryFeeService.findOneCardTopupFee({
        countryId,
        currency: body.keecashWallet,
        usage: body.cardUsage,
      });

    const targetAmount = body.topupAmount;
    const appliedFee = parseFloat(
      (cardTopUpFixedFee + (targetAmount * cardTopUpPercentFee) / 100).toFixed(2),
    );
    const totalToPay = cardPrice + targetAmount + appliedFee;

    const { balance } = await this.transactionService.getBalanceArrayByCurrency(
      userId,
      body.keecashWallet,
    );

    if (balance < totalToPay) {
      throw new BadRequestException('Total pay amount exceeds current wallet balance');
    }

    // Create a Bridgecard
    const bridgecardId = await this.bridgecardService.createCard({
      userId,
      cardholderId,
      type: body.cardType,
      brand: CardBrandEnum.Visa, // default
      currency: body.keecashWallet,
      cardName: body.name,
    });

    // TODO: Implement database transaction rollback mechanism, using queryRunnet.connect() startTransation(), commitTransaction(), rollbackTransaction(), release()
    const { id: cardId } = await this.create({
      userId,
      name: body.name,
      bridgecardId,
      currency: body.keecashWallet,
      usage: body.cardUsage,
    });

    // Create a transaction
    await this.transactionService.create({
      userId,
      currency: body.keecashWallet,
      cardPrice,
      appliedFee,
      affectedAmount: -totalToPay,
      fixedFee: cardTopUpFixedFee,
      percentageFee: cardTopUpPercentFee,
      cardId,
      type: TxTypeEnum.CardCreation,
      status: TransactionStatusEnum.Performed, // Should be set to PENDING and update by webhook
      description: `Created a card "${body.name}" and topped up ${targetAmount} ${body.keecashWallet}`,
    });
  }

  // -------------- CARD TOPUP -------------------

  async getCardTopupSettings(user: UserAccessTokenInterface, query: GetCardTopupSettingDto) {
    const card = await this.findOne({ userId: user.id, bridgecardId: query.bridgecardId });

    if (!card) {
      throw new NotFoundException('Cannot find card with requested id');
    }

    const { cardTopUpFixedFee, cardTopUpPercentFee } =
      await this.countryFeeService.findOneCardTopupFee({
        countryId: user.countryId,
        currency: card.currency,
        usage: card.usage,
      });

    const feesApplied = parseFloat(
      ((parseFloat(query.desiredAmount) * cardTopUpPercentFee) / 100 + cardTopUpFixedFee).toFixed(
        2,
      ),
    );

    const totalToPay = parseFloat(query.desiredAmount) + feesApplied;

    return {
      fixedFee: cardTopUpFixedFee,
      percentageFee: cardTopUpPercentFee,
      feesApplied,
      totalToPay,
    };
  }

  async applyCardTopup(userId: number, countryId: number, body: ApplyCardTopupDto) {
    const { currency, usage } = await this.findOne({ bridgecardId: body.bridgecardId });

    const { cardTopUpFixedFee, cardTopUpPercentFee } =
      await this.countryFeeService.findOneCardTopupFee({ countryId, currency, usage });

    const feesApplied = parseFloat(
      ((body.topupAmount * cardTopUpPercentFee) / 100 + cardTopUpFixedFee).toFixed(2),
    );

    const totalToPay = body.topupAmount + feesApplied;

    const { balance } = await this.transactionService.getBalanceArrayByCurrency(userId, currency);

    if (balance < totalToPay) {
      throw new BadRequestException('Total pay amount exceeds current wallet balance');
    }

    // Deposit to card using Bridgecard provider
    await this.bridgecardService.fundCard({
      card_id: body.bridgecardId,
      amount: body.topupAmount * 100, // Amount in cents
      transaction_reference: uuid(),
      currency,
    });

    await this.transactionService.create({
      userId,
      currency,
      affectedAmount: -totalToPay,
      appliedFee: feesApplied,
      fixedFee: cardTopUpFixedFee,
      percentageFee: cardTopUpPercentFee,
      type: TxTypeEnum.CardTopup,
      status: TransactionStatusEnum.Performed,
      description: `Topup ${body.topupAmount} ${currency} to cardId ${body.bridgecardId}`,
    });

    // TODO: Add to BullMQ
    await this.notificationService.create({
      userId,
      type: NotificationType.CardTopup,
      amount: totalToPay,
      currency,
    });
  }

  // -------------- CARD TOPUP -------------------

  async getCardWithdrawalSettings(countryId: number, query: GetCardWithdrawalSettingDto) {
    const { currency } = await this.findOne({ bridgecardId: query.bridgecardId });

    const { cardWithdrawFixedFee, cardWithdrawPercentFee } =
      await this.countryFeeService.findOneTransferReferralCardWithdrawalFee({
        countryId,
        currency,
      });

    const feesApplied = parseFloat(
      (
        (parseFloat(query.desiredAmount) * cardWithdrawPercentFee) / 100 +
        cardWithdrawFixedFee
      ).toFixed(2),
    );

    const totalToPay = parseFloat(query.desiredAmount) + feesApplied;

    return {
      fixedFee: cardWithdrawFixedFee,
      percentageFee: cardWithdrawPercentFee,
      feesApplied,
      totalToPay,
    };
  }

  async applyCardWithdrawal(userId: number, countryId: number, body: ApplyCardWithdrawalDto) {
    const { currency } = await this.findOne({ bridgecardId: body.bridgecardId });

    const { cardWithdrawFixedFee, cardWithdrawPercentFee } =
      await this.countryFeeService.findOneTransferReferralCardWithdrawalFee({
        countryId,
        currency,
      });

    const feesApplied = parseFloat(
      ((body.withdrawalAmount * cardWithdrawPercentFee) / 100 + cardWithdrawFixedFee).toFixed(2),
    );

    const totalToPay = body.withdrawalAmount + feesApplied;

    const { balance } = await this.transactionService.getBalanceArrayByCurrency(userId, currency);

    if (balance < totalToPay) {
      throw new BadRequestException('Total pay amount exceeds current wallet balance');
    }

    // Withdraw from card using Bridgecard provider
    await this.bridgecardService.unloadCard({
      card_id: body.bridgecardId,
      amount: totalToPay * 100, // Amount in cents
      transaction_reference: uuid(),
      currency,
    });

    await this.transactionService.create({
      userId,
      currency,
      affectedAmount: body.withdrawalAmount,
      appliedFee: feesApplied,
      fixedFee: cardWithdrawFixedFee,
      percentageFee: cardWithdrawPercentFee,
      type: TxTypeEnum.CardWithdrawal,
      status: TransactionStatusEnum.Performed,
      description: `Withdraw ${body.withdrawalAmount} ${currency} from cardId ${body.bridgecardId}`,
    });

    // TODO: Add to BullMQ
    await this.notificationService.create({
      userId,
      type: NotificationType.CardWithdrawal,
      amount: body.withdrawalAmount,
      currency,
    });
  }

  // ------------------ Bridgecard Webhook Handler ----------------------

  async handleBridgecardWebhookEvent(event: string, data: any) {
    switch (event) {
      case 'cardholder_verification.successful':
        await this.userService.update(
          { cardholderId: data.cardholder_id },
          { cardholderVerified: true },
        );
        this.logger.log(`Cardholder: ${data.cardholder_id} is verified successfully`);
        break;

      case 'cardholder_verification.failed':
        this.logger.log(`Verification failed for cardholder: ${data.cardholder_id}`);
        break;

      case 'card_creation_event.successful':
        const { id: userId } = await this.userService.findOne({ cardholderId: data.cardholder_id });
        await this.create({
          userId: userId,
          bridgecardId: data.card_id,
        });
        break;

      case 'card_creation_event.failed':
        break;

      case 'card_credit_event.successful':
        break;

      case 'card_credit_event.failed':
        break;

      case 'card_debit_event.successful':
        break;

      case 'card_debit_event.declined':
        break;

      case 'card_reversal_event.successful':
        break;

      case '3d_secure_otp_event.generated':
        break;

      default:
        break;
    }
  }

  // ------------------ TripleA Webhook Handler ----------------------

  async handleDepositNotification(body: TripleADepositNotifyDto) {
    const details = await this.tripleAService.getDepositDetails(
      body.payment_reference,
      body.order_currency as FiatCurrencyEnum,
    );

    if (details.status === 'done') {
      const keecashId = details.payer_id.split('+')[1]; // payer_id looks like 'keecash+SV08DV8'

      const receiver = await this.userService.findOneWithProfileAndDocuments(
        { referralId: keecashId },
        true,
        false,
      );

      // Update IN PROGRESS transaction's status to 'PERFORMED'
      await this.transactionService.update(
        {
          tripleAPaymentReference: body.payment_reference,
          type: TxTypeEnum.Deposit,
          status: TransactionStatusEnum.InProgress,
        },
        { status: TransactionStatusEnum.Performed },
      );

      const referralUser = await this.userService.getReferralUser(receiver.id);

      if (referralUser) {
        const { referralFixedFee, referralPercentageFee } =
          await this.countryFeeService.findOneTransferReferralCardWithdrawalFee({
            countryId: receiver.personProfile.countryId,
          });

        await this.transactionService.create({
          receiverId: referralUser.id,
          appliedFee: parseFloat(
            ((details.order_amount * referralPercentageFee) / 100 + referralFixedFee).toFixed(2),
          ), // TODO: Check with Hol to define the fee
          fixedFee: referralFixedFee,
          percentageFee: referralPercentageFee,
          type: TxTypeEnum.ReferralFee,
          currency: body.order_currency,
          tripleAPaymentReference: details.payment_reference,
          status: TransactionStatusEnum.Performed,
          description: `Referral fee from ${receiver.referralId}'s deposit`,
        });
      } else {
        // TODO: Update specific status options: 'hold', 'invalid'
        // Update IN PROGRESS transaction's status to 'REJECTED'
        await this.transactionService.update(body.webhook_data.keecash_tx_id, {
          status: TransactionStatusEnum.Rejected,
        });
      }
    }
  }

  async handleWithdrawalNotification(body: TripleAWithdrawalNotifyDto) {
    const details = await this.tripleAService.getWithdrawalDetails(
      body.payout_reference,
      body.local_currency,
    );

    // details.status : 'new', 'confirm', 'done', 'cancel'. See https://developers.triple-a.io/docs/triplea-api-doc/a6c4376384c1e-3-get-payout-details-by-order-id
    if (details.status === 'done') {
      // const { senderId } = await this.transactionService.findOne({
      //   tripleAPaymentReference: body.payout_reference,
      //   type: TxTypeEnum.Withdrawal,
      //   status: TransactionStatusEnum.InProgress
      // });

      // const referralUser = await this.userService.getReferralUser(senderId);

      await this.transactionService.update(
        {
          tripleAPaymentReference: body.payout_reference,
          type: TxTypeEnum.Withdrawal,
          status: TransactionStatusEnum.InProgress,
        },
        {
          status: TransactionStatusEnum.Performed,
        },
      );
    }
  }
}
