import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { WhatsappService } from './whatsapp.service.js';

@ApiTags('WhatsApp')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get WAHA WhatsApp bot session status and QR code for workspace' })
  @ApiParam({ name: 'workspaceId' })
  async getStatus(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.whatsappService.getStatus(workspaceId, userId);
  }

  @Post('connect')
  @ApiOperation({ summary: 'Start WAHA session for workspace and return QR code to scan' })
  @ApiParam({ name: 'workspaceId' })
  async connect(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.whatsappService.connect(workspaceId, userId);
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Logout and disconnect workspace WAHA WhatsApp bot' })
  @ApiParam({ name: 'workspaceId' })
  async disconnect(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.whatsappService.disconnect(workspaceId, userId);
  }

  @Patch('toggle')
  @ApiOperation({ summary: 'Enable or disable WhatsApp notifications for workspace' })
  @ApiParam({ name: 'workspaceId' })
  async toggle(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.whatsappService.toggle(workspaceId, userId, Boolean(body.enabled));
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test WhatsApp message from the workspace bot' })
  @ApiParam({ name: 'workspaceId' })
  async sendTest(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { phone?: string },
  ) {
    return this.whatsappService.sendTestMessage(workspaceId, userId, body?.phone);
  }
}
