import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DatabaseChannel } from './channels/database.channel';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, DatabaseChannel],
  exports: [NotificationsService],
})
export class NotificationsModule {}
