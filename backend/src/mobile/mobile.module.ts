import { Module } from '@nestjs/common';
import { MobileController } from './mobile.controller.js';
import { MobileService } from './mobile.service.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { InboxModule } from '../inbox/inbox.module.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { CyclesModule } from '../cycles/cycles.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TasksModule,
    InboxModule,
    WorkspacesModule,
    ProjectsModule,
    CyclesModule,
    AuthModule,
  ],
  controllers: [MobileController],
  providers: [MobileService],
  exports: [MobileService],
})
export class MobileModule {}
