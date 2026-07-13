import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LeaveCampaignService } from './leave-campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { SubmitProposalDto } from './dto/submit-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leave-campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveCampaignController {
  constructor(private readonly campaignService: LeaveCampaignService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignService.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'HR')
  findAll() {
    return this.campaignService.findAll();
  }

  @Get('current')
  getCurrentCampaign() {
    return this.campaignService.getCurrentCampaign();
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.campaignService.findOne(id);
  }

  @Patch(':id/open')
  @Roles('ADMIN', 'HR')
  openCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.campaignService.openCampaign(id);
  }

  @Patch(':id/close')
  @Roles('ADMIN', 'HR')
  closeCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.campaignService.closeCampaign(id);
  }

  @Get('my/proposal')
  getMyProposal(@CurrentUser() user: { id: number }) {
    return this.campaignService.getMyProposal(user.id);
  }

  @Post('my/proposal')
  submitProposal(
    @CurrentUser() user: { id: number },
    @Body() dto: SubmitProposalDto,
  ) {
    return this.campaignService.submitProposal(user.id, dto);
  }

  @Get(':id/proposals')
  @Roles('ADMIN', 'HR')
  getProposals(@Param('id', ParseIntPipe) id: number) {
    return this.campaignService.getProposals(id);
  }

  @Get(':id/eligible-count')
  @Roles('ADMIN', 'HR')
  getEligibleCount(@Param('id', ParseIntPipe) id: number) {
    return this.campaignService.getEligibleCount(id);
  }

  @Patch('proposals/:proposalId/status')
  @Roles('ADMIN', 'HR')
  updateProposalStatus(
    @Param('proposalId', ParseIntPipe) proposalId: number,
    @Body() dto: UpdateProposalStatusDto,
  ) {
    return this.campaignService.updateProposalStatus(proposalId, dto);
  }
}
