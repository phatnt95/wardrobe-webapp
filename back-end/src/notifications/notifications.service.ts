import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
  ) {}

  async create(data: {
    user: string;
    type: string;
    title: string;
    message: string;
    linkTarget?: string;
  }) {
    const notification = new this.notificationModel(data);
    return notification.save();
  }

  async findByUser(userId: string) {
    return this.notificationModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async markAsRead(userId: string, notificationId: string, isRead: boolean) {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead },
      { new: true },
    );
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }
}
