import { Module } from '@nestjs/common';
import { InboxService } from './inbox.service.js';
import { InboxController } from './inbox.controller.js';

@Module({
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
