import { Controller, Post, Body } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service';
import { LoginDto, RegisterDto } from '@app/shared';

@Controller('auth')
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    console.log('--- NHẬN REQUEST ĐĂNG KÝ ---', dto);
    return this.authServiceService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authServiceService.login(dto);
  }
}
