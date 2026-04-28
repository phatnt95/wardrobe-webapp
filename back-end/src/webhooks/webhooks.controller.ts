import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) { }

  @Post('cloudinary')
  async handleCloudinaryWebhook(
    @Body() payload: any,
    @Headers('x-cld-signature') signature?: string,
    @Headers('x-cld-timestamp') timestamp?: string,
  ) {
    this.logger.log(`Received Cloudinary webhook: ${JSON.stringify(payload)}`);
    await this.webhooksService.handleCloudinaryEvent(payload, signature, timestamp);
    // Cloudinary expects an OK response
    return { status: 'success' };
  }
}
