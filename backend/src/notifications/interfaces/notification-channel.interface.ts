import { Notification } from '@prisma/client';

export interface NotificationPayload {
  userIds: number[];
  title: string;
  message: string;
  type: string;
  link?: string;
  entityType?: string;
  entityId?: number;
}

export interface NotificationChannel {
  readonly name: string;
  send(payload: NotificationPayload): Promise<void>;
}
