import { Module } from '@nestjs/common';
import { ItemsModule } from '../items/items.module';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [ItemsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule { }
