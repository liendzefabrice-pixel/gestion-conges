import { Module } from '@nestjs/common';
import { SeniorityService } from './seniority.service';

@Module({
  providers: [SeniorityService],
  exports: [SeniorityService],
})
export class SeniorityModule {}
