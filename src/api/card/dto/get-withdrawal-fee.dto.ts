import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class GetWithdrawalFeeDto {
  @ApiProperty({ example: '', description: 'Keecash wallet address' })
  @IsString()
  keecash_wallet: string;

  @ApiProperty({ example: '', description: 'Withdrawal method' })
  @IsString()
  withdrawal_method: string;

  @ApiProperty({ example: '', description: 'Withdrawal reason' })
  @IsString()
  reason: string;

  @ApiProperty({ example: 100, description: 'Withdrawal number' })
  @IsNumber()
  desired_amount: number;

  @ApiProperty({ example: '', description: 'Currency' })
  @IsString()
  currency: string; // EUR,USD,BTC,ETH..
}
