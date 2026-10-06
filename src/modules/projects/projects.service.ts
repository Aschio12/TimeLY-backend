import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { accessibleBy } from '@casl/prisma';
import { AppAbility } from '../casl/casl-ability.factory';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(spaceId: string, name: string, description?: string) {
    return this.prisma.project.create({
      data: {
        name,
        description,
        spaceId,
      },
    });
  }

  async getProjectsBySpace(ability: AppAbility, spaceId: string) {
    // Enterprise ABAC query filtering using CASL + Prisma
    // This ensures users can only query projects if they have 'Read' access via their workspace role
    return this.prisma.project.findMany({
      where: {
        AND: [
          accessibleBy(ability).Project,
          { spaceId },
        ],
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  async getProjectDetails(ability: AppAbility, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        AND: [
          accessibleBy(ability).Project,
          { id: projectId },
        ],
      },
      include: {
        tasks: {
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found or unauthorized');
    return project;
  }
}
