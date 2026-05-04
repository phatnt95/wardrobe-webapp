import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../decorators/require-feature.decorator';
import { LicenseService } from '../license.service';

@Injectable()
export class FeatureLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private licenseService: LicenseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @RequireFeature() decorator, allow through
    if (!feature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?._id || request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const countedFeatures = ['items', 'outfits'];
    const booleanFeatures = ['aiFeatures', 'importExport', 'analytics'];

    if (countedFeatures.includes(feature)) {
      const allowed = await this.licenseService.checkLimit(
        userId.toString(),
        feature as 'items' | 'outfits',
      );
      if (!allowed) {
        throw new ForbiddenException(
          `You have reached your plan's ${feature} limit. Please upgrade your plan to continue.`,
        );
      }
    } else if (booleanFeatures.includes(feature)) {
      const allowed = await this.licenseService.checkFeature(
        userId.toString(),
        feature as 'aiFeatures' | 'importExport' | 'analytics',
      );
      if (!allowed) {
        throw new ForbiddenException(
          `The ${feature} feature is not available on your current plan. Please upgrade to access this feature.`,
        );
      }
    }

    return true;
  }
}
