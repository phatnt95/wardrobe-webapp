import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    const clientID =
      configService.get<string>('FACEBOOK_APP_ID') ?? 'PLACEHOLDER';
    const clientSecret =
      configService.get<string>('FACEBOOK_APP_SECRET') ?? 'PLACEHOLDER';
    const callbackURL =
      configService.get<string>('FACEBOOK_CALLBACK_URL') ??
      'http://localhost:3000/auth/facebook/callback';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: Record<string, unknown>) => void,
  ): Promise<void> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      avatarUrl: photos?.[0]?.value,
      provider: 'facebook' as const,
    };
    done(null, user);
  }
}
