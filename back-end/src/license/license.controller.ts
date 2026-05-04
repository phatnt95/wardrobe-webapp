import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LicenseService } from './license.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { LicenseResponseDto } from './dto/license-response.dto';

@ApiTags('licenses')
@Controller('licenses')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List all active subscription plans (public)' })
  @ApiResponse({ status: 200, description: 'List of active plans' })
  getPlans() {
    return this.licenseService.getPlans();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user license and limits',
    description:
      'Returns the user license with resolved plan limits. Auto-creates a Free license if none exists.',
  })
  @ApiResponse({ status: 200, type: LicenseResponseDto })
  getMyLicense(@CurrentUser() user: any): Promise<LicenseResponseDto> {
    return this.licenseService.getUserLicense(
      user._id?.toString() || user.userId,
    );
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Subscribe or change plan',
    description:
      'Subscribes the user to the specified plan. Paid plans expire after 30 days.',
  })
  @ApiResponse({ status: 201, type: LicenseResponseDto })
  subscribe(
    @CurrentUser() user: any,
    @Body() dto: SubscribeDto,
  ): Promise<LicenseResponseDto> {
    return this.licenseService.subscribe(
      user._id?.toString() || user.userId,
      dto,
    );
  }
}
