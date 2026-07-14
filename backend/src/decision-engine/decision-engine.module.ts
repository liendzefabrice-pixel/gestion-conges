import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DecisionEngineController } from './decision-engine.controller';
import { DecisionEngineService } from './decision-engine.service';
import { DepartmentConflictRule } from './rules/department-conflict.rule';
import { InternalEventConflictRule } from './rules/internal-event-conflict.rule';
import { BalanceSufficiencyRule } from './rules/balance-sufficiency.rule';
import { CampaignValidationRule } from './rules/campaign-validation.rule';

@Module({
  imports: [PrismaModule],
  controllers: [DecisionEngineController],
  providers: [
    DecisionEngineService,
    DepartmentConflictRule,
    InternalEventConflictRule,
    BalanceSufficiencyRule,
    CampaignValidationRule,
  ],
  exports: [DecisionEngineService],
})
export class DecisionEngineModule {}
