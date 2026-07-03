import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    userId: number;
    title: string;
    message: string;
    type: NotificationType;
  }) {
    return this.prisma.notification.create({ data: dto });
  }

  async findByUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUnread(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async notifyHR(title: string, message: string, type: NotificationType) {
    const hrUsers = await this.prisma.user.findMany({
      where: { role: { name: 'HR' }, isActive: true },
    });

    for (const user of hrUsers) {
      await this.create({ userId: user.id, title, message, type });
    }
  }

  async notifyDirector(title: string, message: string, type: NotificationType) {
    const directors = await this.prisma.user.findMany({
      where: { role: { name: 'DIRECTOR' }, isActive: true },
    });

    for (const user of directors) {
      await this.create({ userId: user.id, title, message, type });
    }
  }

  async notifyEmployee(employeeId: number, title: string, message: string, type: NotificationType) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (employee) {
      await this.create({ userId: employee.userId, title, message, type });
    }
  }
}
