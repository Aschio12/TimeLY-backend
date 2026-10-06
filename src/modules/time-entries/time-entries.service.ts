import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export class BatchTimeEntryDto {
  windowTitle!: string;
  processName!: string;
  startTime!: string;
  endTime!: string;
  duration!: number;
  taskId?: string;
  categoryId?: string;
}

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async syncBatch(userId: string, workspaceId: string, entries: BatchTimeEntryDto[]) {
    if (!entries || entries.length === 0) return { synced: 0 };

    // Verify workspace membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new BadRequestException('User is not a member of this workspace');
    }

    // In a massive app, we'd use createMany for high-throughput insertion
    const data = entries.map(entry => ({
      userId,
      workspaceId,
      description: entry.windowTitle,
      startTime: new Date(entry.startTime),
      endTime: new Date(entry.endTime),
      duration: entry.duration,
      taskId: entry.taskId,
      categoryId: entry.categoryId,
    }));

    const result = await this.prisma.timeEntry.createMany({
      data,
      skipDuplicates: true, // Prevents crashing on retries if we implement unique constraint
    });

    return { synced: result.count };
  }
}
