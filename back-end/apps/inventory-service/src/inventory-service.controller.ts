import { Controller, Get } from '@nestjs/common';
import { InventoryServiceService } from './inventory-service.service';
import { EventPattern } from '@nestjs/microservices';
import { OwnerService } from './owner/owner.service';

@Controller()
export class InventoryServiceController {
  constructor(
    private readonly inventoryServiceService: InventoryServiceService,
    private readonly ownerService: OwnerService,
  ) {}

  @EventPattern('user_created')
  async handleUserCreated(data: any) {
    console.log('Tạo tủ đồ mới cho user:', data.email);
    const newOwner = {
      authId: data.authId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    };
    console.log('New Owner Data:', newOwner);
    this.ownerService.create(newOwner);
  }

  @Get()
  getHello(): string {
    return this.inventoryServiceService.getHello();
  }
}
