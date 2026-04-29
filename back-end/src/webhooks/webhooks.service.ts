import { Injectable, Logger } from '@nestjs/common';
import { ItemsService } from '../items/items.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly itemsService: ItemsService) {}

  async handleCloudinaryEvent(payload: any, signature?: string, timestamp?: string) {
    // We check if this webhook is for background removal completion
    if (payload.notification_type === 'info' && payload.info_kind === 'background_removal') {
      if (payload.info_status === 'complete') {
        const publicId = payload.public_id;
        const newSecureUrl = payload.secure_url;
        
        if (publicId && newSecureUrl) {
          this.logger.log(`Background removal complete for ${publicId}. Updating DB...`);
          await this.itemsService.updateImageByPublicId(publicId, newSecureUrl);
        } else {
          this.logger.warn(`Missing public_id or secure_url in payload for ${payload.info_kind}`);
        }
      }
    }
  }
}
