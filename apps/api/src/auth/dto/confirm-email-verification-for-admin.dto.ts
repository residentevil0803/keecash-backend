import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ConfirmEmailVerificationCodeForAdminDto {
  @ApiProperty({
    example: 'user@example.com',
    required: true,
    maximum: 255,
    description: 'Email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '15111',
    required: true,
    maximum: 255,
    description: 'Verification Code',
  })
  @IsString()
  code: string;
}
