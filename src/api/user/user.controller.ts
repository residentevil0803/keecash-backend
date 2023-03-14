import { Controller, Request, UseGuards, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@api/auth/guards/jwt-auth.guard';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiTags('Get referrals')
  @ApiOperation({ description: 'Get all referred users' })
  @UseGuards(JwtAuthGuard)
  @Get('referral')
  async getReferral(@Request() req) {
    const { referralId } = await this.userService.findOneById(req.user.id);
    const referredUsers = await this.userService.getReferredUsersByReferralId(referralId);

    return {
      referral_id: referralId,
      godsons: referredUsers,
    };
  }

  // @ApiOperation({ description: `Check if referral id exists` })
  // @Post('auth/check-referralid')
  // async checkIfReferralIdExists() {
  //   return true;
  // }

  // @ApiOperation({ description: `Create account` })
  // @UseGuards(JwtAuthGuard)
  // @Post('auth/add-personal-user-info')
  // async addPersonalUserInfo(@Request() req, @Body() body: AddPersonUserInfoDto) {
  //   const updatedUser = await this.userService.addPersonalUserInfo(req.user.email, body);

  //   return this.userService.createAccessToken(updatedUser);
  // }

  // @ApiOperation({ description: `Get sumsub api access token for development` })
  // @Get('auth/dev-sumsub-access-token')
  // async getSumsubAccessToken() {
  //   return {
  //     token: await this.userService.getSumsubAccessToken(),
  //     userId: 'JamesBond007',
  //   };
  // }
}
