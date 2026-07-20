import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DatabaseChannel } from './channels/database.channel';
import { MailChannel } from './channels/mail.channel';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, DatabaseChannel, MailChannel],
  exports: [NotificationsService],
})
export class NotificationsModule {}
