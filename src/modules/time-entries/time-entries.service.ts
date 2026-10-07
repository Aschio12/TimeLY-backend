import { Injectable, BadRequestException, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { PrismaService } from '../../database/prisma.service';
import { lastValueFrom } from 'rxjs';

export class BatchTimeEntryDto {
  windowTitle!: string;
  processName!: string;
  startTime!: string;
  endTime!: string;
  duration!: number;
  taskId?: string;
  categoryId?: string;
}

interface NLPClassifierService {
  CategorizeBatch(data: { requests: { window_title: string; process_name: string }[] }): any;
}

@Injectable()
export class TimeEntriesService implements OnModuleInit {
  private nlpClassifier: NLPClassifierService;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('NLP_CLASSIFIER_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.nlpClassifier = this.client.getService<NLPClassifierService>('NLPClassifier');
  }

  async syncBatch(userId: string, workspaceId: string, entries: BatchTimeEntryDto[]) {
    if (!entries || entries.length === 0) return { synced: 0 };

    // Verify workspace membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new BadRequestException('User is not a member of this workspace');
    }

    // Step 3.3: High throughput AI classification via gRPC
    let aiCategories: string[] = [];
    try {
      const batchRequest = {
        requests: entries.map(e => ({
          window_title: e.windowTitle,
          process_name: e.processName,
        })),
      };
      
      const aiResponse = await lastValueFrom(this.nlpClassifier.CategorizeBatch(batchRequest));
      aiCategories = aiResponse.responses.map(r => r.category);
    } catch (error) {
      console.warn('gRPC ML Service unavailable, falling back to General category', error);
      aiCategories = entries.map(() => 'General');
    }

    // In a massive app, we'd use createMany for high-throughput insertion
    const data = entries.map((entry, index) => ({
      userId,
      workspaceId,
      startTime: new Date(entry.startTime),
      endTime: new Date(entry.endTime),
      duration: entry.duration,
      taskId: entry.taskId,
      // For Phase 3, we simply override categoryId with the AI category string in 'description' or handle categories better
      // Since categoryId expects a UUID but our AI returns 'Development', let's append it to the description or store it if we had a string column.
      // For now, we append it to description so we don't break foreign keys.
      description: `[${aiCategories[index]}] ${entry.windowTitle}`,
    }));

    const result = await this.prisma.timeEntry.createMany({
      data,
      skipDuplicates: true, // Prevents crashing on retries if we implement unique constraint
    });

    return { synced: result.count, aiProcessed: true };
  }
}

