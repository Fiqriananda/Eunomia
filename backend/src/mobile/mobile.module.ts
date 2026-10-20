import { Module } from '@nestjs/common';
import { MobileController } from './mobile.controller.js';
import { MobileService } from './mobile.service.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { InboxModule } from '../inbox/inbox.module.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';

@Module({
  imports: [TasksModule, InboxModule, WorkspacesModule],
  controllers: [MobileController],
  providers: [MobileService],
  exports: [MobileService],
})
export class MobileModule {}
