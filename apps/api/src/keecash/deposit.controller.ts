import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeecashService } from './keecash.service';
import { JwtAuthGuard } from '@api/auth/guards/jwt-auth.guard';
import { GetDepositFeeDto } from './dto/get-deposit-fee.dto';
import { DepositPaymentLinkDto } from './dto/deposit-payment-link.dto';

@ApiTags('Deposit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deposit')
export class DepositController {
  constructor(private readonly keecashService: KeecashService) {}

  @ApiOperation({ description: 'Post deposit fees' })
  @Get('fees')
  async depositFees(@Req() req, @Query() query: GetDepositFeeDto) {
    return this.keecashService.getDepositFee(req.user.countryId, query);
  }

  @ApiOperation({ description: 'Post deposit payment link' })
  @Post('payment-link')
  async getDepositPaymentLink(@Req() req, @Body() body: DepositPaymentLinkDto): Promise<any> {
    return this.keecashService.getDepositPaymentLink(req.user, body);
  }
}
