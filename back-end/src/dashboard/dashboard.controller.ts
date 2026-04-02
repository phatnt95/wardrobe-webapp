import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseFloatPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('home')
  @ApiOperation({
    summary: 'Get home dashboard data',
    description:
      'Single endpoint for the home page. Aggregates weather, AI outfit recommendation, ' +
      'recent items and wardrobe stats in one call (BFF pattern). ' +
      'Weather is cached for 30 minutes; OOTD falls back to rule-based logic if Gemini is unavailable.',
  })
  @ApiQuery({
    name: 'lat',
    type: Number,
    required: false,
    description: 'Latitude of the user\'s location (defaults to Ho Chi Minh City)',
    example: 10.8231,
  })
  @ApiQuery({
    name: 'lon',
    type: Number,
    required: false,
    description: 'Longitude of the user\'s location (defaults to Ho Chi Minh City)',
    example: 106.6297,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data aggregated and returned successfully',
    type: DashboardResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT token' })
  async getHomeDashboard(
    @CurrentUser() user: { _id: string },
    // Default to Ho Chi Minh City if client doesn't supply coordinates yet
    @Query('lat', new DefaultValuePipe(10.8231), ParseFloatPipe) lat: number,
    @Query('lon', new DefaultValuePipe(106.6297), ParseFloatPipe) lon: number,
  ): Promise<DashboardResponseDto> {
    console.log(user);
    return this.dashboardService.getHomeDashboard(user._id, lat, lon);
  }
}
