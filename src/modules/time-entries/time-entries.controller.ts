import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TimeEntriesService, BatchTimeEntryDto } from './time-entries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { PoliciesGuard, CheckPolicies } from '../../common/guards/policies.guard';
import { Action, AppAbility } from '../casl/casl-ability.factory';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('workspaces/:workspaceId/time-entries')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Post('batch')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, 'TimeEntry'))
  async syncBatch(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body('entries') entries: BatchTimeEntryDto[],
  ) {
    return this.timeEntriesService.syncBatch(user.id, workspaceId, entries);
  }
}
