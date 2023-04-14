import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { CryptoTransactionFilterDto } from '@src/api/triple-a/dto/crypto-transaction-filter.dto';

export class GetCryptoTxAdminDto extends CryptoTransactionFilterDto {
  @ApiProperty({
    example: 1,
    required: true,
    maximum: 255,
    description: 'Email address',
  })
  @IsInt()
  userId: number;
}
