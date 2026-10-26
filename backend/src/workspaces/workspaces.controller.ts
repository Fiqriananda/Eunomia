import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service.js';
import { JwtAuthGuard, Public } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { WorkspaceRole, TaskStatus } from '@prisma/client';

@ApiTags('Workspaces')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all workspaces where the current user is a member' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async getUserWorkspaces(@CurrentUser('id') userId: string) {
    return this.workspacesService.getUserWorkspaces(userId);
  }

  @Public()
  @Get('invitations/:token')
  @ApiOperation({ summary: 'Get invitation details by token' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  async getInvitationByToken(@Param('token') token: string) {
    return this.workspacesService.getInvitationByToken(token);
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept workspace invitation' })
  @ApiParam({ name: 'token', description: 'Invitation token or ID' })
  async acceptInvitation(
    @Param('token') token: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.acceptInvitation(token, userId);
  }

  @Post('invitations/:token/decline')
  @ApiOperation({ summary: 'Decline workspace invitation' })
  @ApiParam({ name: 'token', description: 'Invitation token or ID' })
  async declineInvitation(
    @Param('token') token: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.declineInvitation(token, userId);
  }

  @Public()
  @Post('invitations/:token/accept-public')
  @ApiOperation({ summary: 'Accept invitation and create/setup account directly (public)' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  async acceptInvitationPublic(
    @Param('token') token: string,
    @Body() body: { name?: string; password?: string },
  ) {
    return this.workspacesService.acceptInvitationPublic(token, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details by ID' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace information' })
  async getWorkspaceById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.workspacesService.getWorkspaceById(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace settings (e.g. name, cyclesEnabled)' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Acme Corp' },
        cyclesEnabled: { type: 'boolean', example: false },
      },
    },
  })
  async updateWorkspace(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; cyclesEnabled?: boolean; logoUrl?: string | null },
  ) {
    return this.workspacesService.updateWorkspace(id, userId, body);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiBody({ schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', example: 'Acme Corp' } } } })
  @ApiResponse({ status: 201, description: 'Workspace created' })
  async createWorkspace(
    @CurrentUser('id') userId: string,
    @Body() body: { name: string },
  ) {
    return this.workspacesService.createWorkspace(userId, body);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List workspace members' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async getWorkspaceMembers(@Param('id') id: string) {
    return this.workspacesService.getWorkspaceMembers(id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite a member to the workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'colleague@linear.app' },
        name: { type: 'string', example: 'John Doe' },
        role: { type: 'string', enum: ['OWNER', 'ADMIN', 'MEMBER'], example: 'MEMBER' },
      },
    },
  })
  async inviteMember(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { email: string; name?: string; role?: WorkspaceRole },
  ) {
    return this.workspacesService.inviteMember(id, userId, body);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'List pending workspace invitations (Owner/Admin only)' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async getWorkspaceInvitations(
    @Param('id') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.getWorkspaceInvitations(workspaceId, userId);
  }

  @Delete(':id/invitations/:invitationId')
  @ApiOperation({ summary: 'Cancel a pending workspace invitation (Owner/Admin only)' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'invitationId', description: 'Invitation ID' })
  async cancelInvitation(
    @Param('id') workspaceId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.cancelInvitation(workspaceId, invitationId, userId);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update a member role' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: ['OWNER', 'ADMIN', 'MEMBER'] } } } })
  async updateMemberRole(
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body('role') role: WorkspaceRole,
  ) {
    return this.workspacesService.updateMemberRole(workspaceId, memberId, role);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  async removeMember(
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.removeMember(workspaceId, memberId);
  }

  @Get(':id/sections')
  @ApiOperation({ summary: 'Get custom workflow sections/columns for a workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async getWorkspaceSections(@Param('id') id: string) {
    return this.workspacesService.getWorkspaceSections(id);
  }

  @Post(':id/sections')
  @ApiOperation({ summary: 'Create a custom workflow section/column' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'In Review' },
        key: { type: 'string', example: 'in_review' },
        color: { type: 'string', example: '#8b5cf6' },
        category: { type: 'string', enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'], example: 'IN_PROGRESS' },
      },
    },
  })
  async createWorkspaceSection(
    @Param('id') id: string,
    @Body() body: { name: string; key?: string; color?: string; category?: TaskStatus },
  ) {
    return this.workspacesService.createWorkspaceSection(id, body);
  }

  @Delete(':id/sections/:sectionId')
  @ApiOperation({ summary: 'Delete a custom workflow section' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'sectionId', description: 'Section ID' })
  async deleteWorkspaceSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.workspacesService.deleteWorkspaceSection(id, sectionId);
  }

  @Patch(':id/columns')
  @ApiOperation({ summary: 'Update column ordering for board views' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        columnOrder: { type: 'array', items: { type: 'string' }, example: ['TODO', 'IN_PROGRESS', 'DONE'] },
      },
    },
  })
  async updateColumnOrder(
    @Param('id') id: string,
    @Body() body: { columnOrder: string[] },
  ) {
    return this.workspacesService.updateColumnOrder(id, body.columnOrder);
  }

  // --- Divisions / Teams Endpoints ---

  @Get(':id/divisions')
  @ApiOperation({ summary: 'Get all divisions in a workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async getDivisions(@Param('id') workspaceId: string) {
    return this.workspacesService.getWorkspaceDivisions(workspaceId);
  }

  @Post(':id/divisions')
  @ApiOperation({ summary: 'Create a new division' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async createDivision(
    @Param('id') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { name: string; slug?: string; description?: string; isTechnical?: boolean },
  ) {
    return this.workspacesService.createDivision(workspaceId, userId, body);
  }

  @Patch(':id/divisions/:divisionId')
  @ApiOperation({ summary: 'Update a division' })
  @ApiParam({ name: 'divisionId', description: 'Division ID' })
  async updateDivision(
    @Param('divisionId') divisionId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; slug?: string; description?: string; isTechnical?: boolean },
  ) {
    return this.workspacesService.updateDivision(divisionId, userId, body);
  }

  @Delete(':id/divisions/:divisionId')
  @ApiOperation({ summary: 'Delete a division' })
  @ApiParam({ name: 'divisionId', description: 'Division ID' })
  async deleteDivision(
    @Param('divisionId') divisionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.deleteDivision(divisionId, userId);
  }

  @Post(':id/divisions/:divisionId/members')
  @ApiOperation({ summary: 'Add/assign user to a division' })
  @ApiParam({ name: 'divisionId', description: 'Division ID' })
  async addDivisionMember(
    @Param('divisionId') divisionId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { userId: string; role?: string },
  ) {
    return this.workspacesService.addDivisionMember(divisionId, userId, body.userId, body.role);
  }

  @Delete(':id/divisions/:divisionId/members/:targetUserId')
  @ApiOperation({ summary: 'Remove user from a division' })
  @ApiParam({ name: 'divisionId', description: 'Division ID' })
  @ApiParam({ name: 'targetUserId', description: 'Target User ID to remove' })
  async removeDivisionMember(
    @Param('divisionId') divisionId: string,
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.removeDivisionMember(divisionId, userId, targetUserId);
  }
}
