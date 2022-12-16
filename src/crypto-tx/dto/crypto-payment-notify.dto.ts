import { ApiProperty } from '@nestjs/swagger';
import { MaxLength, IsString } from 'class-validator';

export class CryptoPaymentNotifyDto {
  @ApiProperty({
    example: 'AGJ-937870-PYT',
    required: true,
    maximum: 255,
    description: 'Payment reference',
  })
  @IsString()
  @MaxLength(255)
  payment_reference: string;
}