import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.schema';

interface SocialCallbackUser {
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  provider: 'google' | 'facebook';
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Throttle({ short: { limit: 3, ttl: 60000 }, medium: { limit: 5, ttl: 120000 }, long: { limit: 10, ttl: 300000 } })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Throttle({ short: { limit: 5, ttl: 60000 }, medium: { limit: 10, ttl: 120000 }, long: { limit: 20, ttl: 300000 } })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - token invalid or expired',
  })
  async getMe(@CurrentUser() user: User): Promise<UserProfileDto> {
    return this.authService.getMe(
      String(user._id),
    ) as unknown as UserProfileDto;
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redirect to Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Google auth page' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  googleAuth(@Req() _req: Request) {
    // Passport redirects automatically
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback — issues JWT and redirects to frontend',
  })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with token' })
  @Throttle({ short: { limit: 5, ttl: 60000 }, medium: { limit: 10, ttl: 120000 }, long: { limit: 20, ttl: 300000 } })
  async googleCallback(
    @Req() req: Request & { user: SocialCallbackUser },
    @Res() res: Response,
  ) {
    const result = await this.authService.validateSocialLogin(req.user);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    return res.redirect(
      `${frontendUrl}/auth/callback?token=${result.access_token}`,
    );
  }

  // ─── Facebook OAuth ───────────────────────────────────────────────────────

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Redirect to Facebook OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Facebook auth page' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  facebookAuth(@Req() _req: Request) {
    // Passport redirects automatically
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Facebook OAuth callback — issues JWT and redirects to frontend',
  })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with token' })
  @Throttle({ short: { limit: 5, ttl: 60000 }, medium: { limit: 10, ttl: 120000 }, long: { limit: 20, ttl: 300000 } })
  async facebookCallback(
    @Req() req: Request & { user: SocialCallbackUser },
    @Res() res: Response,
  ) {
    const result = await this.authService.validateSocialLogin(req.user);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    return res.redirect(
      `${frontendUrl}/auth/callback?token=${result.access_token}`,
    );
  }
}
