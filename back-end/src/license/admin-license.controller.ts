import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LicenseService } from './license.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { LicenseResponseDto } from './dto/license-response.dto';

@ApiTags('admin/licenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/licenses')
export class AdminLicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  @ApiOperation({ summary: 'List all user licenses (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated list of user licenses' })
  getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = parseInt(page as any, 10) || 1;
    const limitNumber = parseInt(limit as any, 10) || 20;
    return this.licenseService.adminGetAll(pageNumber, limitNumber);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Override a user plan (admin only)' })
  @ApiResponse({ status: 200, type: LicenseResponseDto })
  setUserPlan(
    @Param('userId') userId: string,
    @Body() body: { plan: string },
  ): Promise<LicenseResponseDto> {
    return this.licenseService.adminSetPlan(userId, body.plan);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new license plan (admin only)' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.licenseService.adminCreatePlan(dto);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update a license plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.licenseService.adminUpdatePlan(id, dto);
  }
}
