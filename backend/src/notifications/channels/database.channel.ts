import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationChannel, NotificationPayload } from '../interfaces/notification-channel.interface';

@Injectable()
export class DatabaseChannel implements NotificationChannel {
  readonly name = 'database';

  constructor(private prisma: PrismaService) {}

  async send(payload: NotificationPayload): Promise<void> {
    const { userIds, title, message, type, link, entityType, entityId } = payload;

    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type: type as any,
        link,
        entityType,
        entityId,
      })),
    });
  }
}
