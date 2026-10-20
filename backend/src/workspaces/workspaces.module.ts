import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WorkspacesService } from './workspaces.service.js';
import { WorkspacesController } from './workspaces.controller.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'linear_clone_super_secret_jwt_key_2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}

