import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OutfitsService } from './outfits.service';
import { OutfitsController } from './outfits.controller';
import { Outfit, OutfitSchema } from './outfit.schema';
import { LicenseModule } from '../license/license.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Outfit.name, schema: OutfitSchema }]),
    LicenseModule,
  ],
  controllers: [OutfitsController],
  providers: [OutfitsService],
})
export class OutfitsModule {}
