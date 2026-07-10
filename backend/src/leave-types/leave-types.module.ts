import { Module } from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';
import { LeaveTypesController } from './leave-types.controller';

@Module({
  controllers: [LeaveTypesController],
  providers: [LeaveTypesService],
})
export class LeaveTypesModule {}
