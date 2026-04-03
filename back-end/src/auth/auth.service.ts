import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.schema';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

interface SocialProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  provider: 'google' | 'facebook';
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getMe(userId: string): Promise<User> {
    return this.usersService.getProfile(userId);
  }

  async validateSocialLogin(profile: SocialProfile): Promise<AuthResponseDto> {
    const { email, firstName, lastName, avatarUrl, provider } = profile;

    if (!email) {
      throw new UnauthorizedException(
        `No email returned from ${provider}. Please grant email permission.`,
      );
    }

    let user = await this.usersService.findByEmail(email);

    if (user) {
      // Update avatar from provider if not set
      if (!user.avatarUrl && avatarUrl) {
        await this.usersService.updateAvatar(String(user._id), avatarUrl);
      }
    } else {
      // Create new user from social profile (no password required)
      user = await this.usersService.createSocialUser({
        email,
        firstName,
        lastName,
        avatarUrl,
        provider,
      });
    }

    // At this point user is guaranteed non-null: found or just created
    const resolvedUser = user!;
    const payload = { sub: resolvedUser._id, email: resolvedUser.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
