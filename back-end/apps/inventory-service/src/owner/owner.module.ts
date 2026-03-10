import { Module } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { OwnerController } from './owner.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Owner, OwnerSchema } from '../../../../libs/shared/src/schema/owner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Owner.name, schema: OwnerSchema
      }
    ])
  ],
  controllers: [OwnerController],
  providers: [OwnerService],
  exports: [OwnerService],
})
export class OwnerModule {}
