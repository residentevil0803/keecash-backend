import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber } from 'class-validator';

export class SendPhoneNumberVerificationCodeDto {
  @ApiProperty({
    example: '+XXXXXXXXXXX',
    required: true,
    maximum: 255,
    description: 'Phone number',
  })
  @IsPhoneNumber()
  phoneNumber: string;
}