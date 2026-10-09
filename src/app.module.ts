import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { CaslModule } from './modules/casl/casl.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';

import { InvoiceModule } from './modules/invoice/invoice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CaslModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    TimeEntriesModule,
    InvoiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
