import { Module } from '@nestjs/common';
import { LeaveCampaignService } from './leave-campaign.service';
import { LeaveCampaignController } from './leave-campaign.controller';
import { LeaveBalanceEngineModule } from '../leave-balance-engine/leave-balance-engine.module';
import { LeavePlanningEngineModule } from '../leave-planning-engine/leave-planning-engine.module';

@Module({
  imports: [LeaveBalanceEngineModule, LeavePlanningEngineModule],
  controllers: [LeaveCampaignController],
  providers: [LeaveCampaignService],
})
export class LeaveCampaignModule {}
