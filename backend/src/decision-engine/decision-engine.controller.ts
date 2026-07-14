import { Controller, Post, Get, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DecisionEngineService } from './decision-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('decision-engine')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DecisionEngineController {
  constructor(private readonly service: DecisionEngineService) {}

  @Post('analyze/:entityType/:entityId')
  @Roles('ADMIN', 'HR')
  analyze(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
    @CurrentUser() user: any,
  ) {
    if (!['LEAVE_REQUEST', 'LEAVE_PROPOSAL'].includes(entityType)) {
      throw new Error('Type d\'entité invalide. Utilisez LEAVE_REQUEST ou LEAVE_PROPOSAL.');
    }
    return this.service.analyze(entityType as any, entityId, user.id);
  }

  @Get('analyses/:entityType/:entityId')
  @Roles('ADMIN', 'HR')
  getAnalyses(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    return this.service.getAnalysesForEntity(entityType, entityId);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  getAnalysis(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAnalysis(id);
  }

  @Post(':id/decision')
  @Roles('ADMIN', 'HR')
  recordDecision(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { decision: string; comment?: string },
    @CurrentUser() user: any,
  ) {
    return this.service.recordDecision(id, body.decision, body.comment, user.id);
  }
}
