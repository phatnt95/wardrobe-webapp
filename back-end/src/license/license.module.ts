import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LicensePlan,
  LicensePlanSchema,
} from './schemas/license-plan.schema';
import {
  UserLicense,
  UserLicenseSchema,
} from './schemas/user-license.schema';
import { Item, ItemSchema } from '../items/item.schema';
import { Outfit, OutfitSchema } from '../outfits/outfit.schema';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { AdminLicenseController } from './admin-license.controller';
import { FeatureLimitGuard } from './guards/feature-limit.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LicensePlan.name, schema: LicensePlanSchema },
      { name: UserLicense.name, schema: UserLicenseSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Outfit.name, schema: OutfitSchema },
    ]),
  ],
  controllers: [LicenseController, AdminLicenseController],
  providers: [LicenseService, FeatureLimitGuard],
  exports: [LicenseService, FeatureLimitGuard],
})
export class LicenseModule implements OnModuleInit {
  constructor(private readonly licenseService: LicenseService) {}

  async onModuleInit(): Promise<void> {
    await this.licenseService.seedPlans();
  }
}
