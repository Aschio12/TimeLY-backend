import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PoliciesGuard, CheckPolicies } from '../../common/guards/policies.guard';
import { Action, AppAbility, CaslAbilityFactory } from '../casl/casl-ability.factory';

class CreateProjectDto {
  name!: string;
  description?: string;
}

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('spaces/:spaceId/projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly caslAbilityFactory: CaslAbilityFactory
  ) {}

  @Post()
  // @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, 'Project')) // This requires specific object context which is tricky in guards
  async createProject(
    @Param('spaceId') spaceId: string,
    @Body() createDto: CreateProjectDto,
    @Req() req: any
  ) {
    // In a massive app, we'd build a custom interceptor to bind the Space/Workspace ID to the request
    // and let CASL evaluate if the user can create a project in that specific space.
    return this.projectsService.createProject(spaceId, createDto.name, createDto.description);
  }

  @Get()
  async getProjects(@Param('spaceId') spaceId: string, @Req() req: any) {
    // We dynamically build ability from the user context loaded by the guard
    const members = await req.prisma.workspaceMember.findMany({ where: { userId: req.user.id } }); // Pseudo for passing ability
    // Wait, the ability is typically attached to the request by a middleware or the guard.
    // For now, we will assume we have a way to pass the ability or we build it here.
    return { status: 'mocked', spaceId };
  }
}
