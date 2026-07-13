import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { LeaveBalanceEngineModule } from '../leave-balance-engine/leave-balance-engine.module';

@Module({
  imports: [LeaveBalanceEngineModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
