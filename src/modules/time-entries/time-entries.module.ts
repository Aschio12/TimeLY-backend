import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntriesController } from './time-entries.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NLP_CLASSIFIER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'classification',
          protoPath: join(__dirname, '../../../src/proto/classification.proto'),
          url: 'localhost:50051',
        },
      },
    ]),
  ],
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService],
  exports: [TimeEntriesService],
})
export class TimeEntriesModule {}
