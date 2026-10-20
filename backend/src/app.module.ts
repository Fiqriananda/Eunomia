import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { WorkspacesModule } from './workspaces/workspaces.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { InboxModule } from './inbox/inbox.module.js';
import { EmailModule } from './email/email.module.js';
import { MobileModule } from './mobile/mobile.module.js';
import { EventsModule } from './events/events.module.js';
import { CyclesModule } from './cycles/cycles.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    UploadsModule,
    InboxModule,
    EmailModule,
    MobileModule,
    EventsModule,
    CyclesModule,
  ],
})
export class AppModule {}
