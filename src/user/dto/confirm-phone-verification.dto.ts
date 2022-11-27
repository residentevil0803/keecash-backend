import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString } from 'class-validator';

export class ConfirmPhoneNumberVerificationCodeDto {
  @ApiProperty({
    example: '+XXXXXXXXXXX',
    required: true,
    maximum: 255,
    description: 'Phone Number',
  })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({
    example: '15411',
    required: true,
    maximum: 255,
    description: 'Verification Code',
  })
  @IsString()
  code: string;
}