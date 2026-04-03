import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') ?? 'PLACEHOLDER';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') ?? 'PLACEHOLDER';
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') ?? 'http://localhost:3000/auth/google/callback';

    super({ clientID, clientSecret, callbackURL, scope: ['email', 'profile'] });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      emails?: Array<{ value: string }>;
      name?: { givenName?: string; familyName?: string };
      photos?: Array<{ value: string }>;
    },
    done: VerifyCallback,
  ): Promise<void> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      avatarUrl: photos?.[0]?.value,
      provider: 'google' as const,
    };
    done(null, user);
  }
}
