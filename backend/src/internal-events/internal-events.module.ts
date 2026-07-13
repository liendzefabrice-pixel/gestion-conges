import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InternalEventsService } from './internal-events.service';
import { InternalEventsController } from './internal-events.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InternalEventsController],
  providers: [InternalEventsService],
  exports: [InternalEventsService],
})
export class InternalEventsModule {}
