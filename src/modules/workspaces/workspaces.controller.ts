import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

class CreateWorkspaceDto {
  name!: string;
  description?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async createWorkspace(
    @CurrentUser() user: User,
    @Body() createDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.createWorkspace(user.id, createDto);
  }

  @Get()
  async getUserWorkspaces(@CurrentUser() user: User) {
    return this.workspacesService.getUserWorkspaces(user.id);
  }

  @Get(':id')
  async getWorkspaceById(
    @CurrentUser() user: User,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.getWorkspaceById(user.id, workspaceId);
  }
}
