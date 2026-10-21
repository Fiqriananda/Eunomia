var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service.js';
import { JwtAuthGuard, Public } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { WorkspaceRole } from '@prisma/client';
let WorkspacesController = class WorkspacesController {
    workspacesService;
    constructor(workspacesService) {
        this.workspacesService = workspacesService;
    }
    async getUserWorkspaces(userId) {
        return this.workspacesService.getUserWorkspaces(userId);
    }
    async getInvitationByToken(token) {
        return this.workspacesService.getInvitationByToken(token);
    }
    async acceptInvitation(token, userId) {
        return this.workspacesService.acceptInvitation(token, userId);
    }
    async declineInvitation(token, userId) {
        return this.workspacesService.declineInvitation(token, userId);
    }
    async acceptInvitationPublic(token, body) {
        return this.workspacesService.acceptInvitationPublic(token, body);
    }
    async getWorkspaceById(id, userId) {
        return this.workspacesService.getWorkspaceById(id, userId);
    }
    async updateWorkspace(id, userId, body) {
        return this.workspacesService.updateWorkspace(id, userId, body);
    }
    async createWorkspace(userId, body) {
        return this.workspacesService.createWorkspace(userId, body);
    }
    async getWorkspaceMembers(id) {
        return this.workspacesService.getWorkspaceMembers(id);
    }
    async inviteMember(id, userId, body) {
        return this.workspacesService.inviteMember(id, userId, body);
    }
    async getWorkspaceInvitations(workspaceId, userId) {
        return this.workspacesService.getWorkspaceInvitations(workspaceId, userId);
    }
    async cancelInvitation(workspaceId, invitationId, userId) {
        return this.workspacesService.cancelInvitation(workspaceId, invitationId, userId);
    }
    async updateMemberRole(workspaceId, memberId, role) {
        return this.workspacesService.updateMemberRole(workspaceId, memberId, role);
    }
    async removeMember(workspaceId, memberId) {
        return this.workspacesService.removeMember(workspaceId, memberId);
    }
    async getWorkspaceSections(id) {
        return this.workspacesService.getWorkspaceSections(id);
    }
    async createWorkspaceSection(id, body) {
        return this.workspacesService.createWorkspaceSection(id, body);
    }
    async deleteWorkspaceSection(id, sectionId) {
        return this.workspacesService.deleteWorkspaceSection(id, sectionId);
    }
    async updateColumnOrder(id, body) {
        return this.workspacesService.updateColumnOrder(id, body.columnOrder);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all workspaces where the current user is a member' }),
    ApiResponse({ status: 200, description: 'List of workspaces' }),
    __param(0, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getUserWorkspaces", null);
__decorate([
    Public(),
    Get('invitations/:token'),
    ApiOperation({ summary: 'Get invitation details by token' }),
    ApiParam({ name: 'token', description: 'Invitation token' }),
    __param(0, Param('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getInvitationByToken", null);
__decorate([
    Post('invitations/:token/accept'),
    ApiOperation({ summary: 'Accept workspace invitation' }),
    ApiParam({ name: 'token', description: 'Invitation token or ID' }),
    __param(0, Param('token')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "acceptInvitation", null);
__decorate([
    Post('invitations/:token/decline'),
    ApiOperation({ summary: 'Decline workspace invitation' }),
    ApiParam({ name: 'token', description: 'Invitation token or ID' }),
    __param(0, Param('token')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "declineInvitation", null);
__decorate([
    Public(),
    Post('invitations/:token/accept-public'),
    ApiOperation({ summary: 'Accept invitation and create/setup account directly (public)' }),
    ApiParam({ name: 'token', description: 'Invitation token' }),
    __param(0, Param('token')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "acceptInvitationPublic", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get workspace details by ID' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiResponse({ status: 200, description: 'Workspace information' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getWorkspaceById", null);
__decorate([
    Patch(':id'),
    ApiOperation({ summary: 'Update workspace settings (e.g. name, cyclesEnabled)' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'Acme Corp' },
                cyclesEnabled: { type: 'boolean', example: false },
            },
        },
    }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "updateWorkspace", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new workspace' }),
    ApiBody({ schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', example: 'Acme Corp' } } } }),
    ApiResponse({ status: 201, description: 'Workspace created' }),
    __param(0, CurrentUser('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "createWorkspace", null);
__decorate([
    Get(':id/members'),
    ApiOperation({ summary: 'List workspace members' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getWorkspaceMembers", null);
__decorate([
    Post(':id/invite'),
    ApiOperation({ summary: 'Invite a member to the workspace' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiBody({
        schema: {
            type: 'object',
            required: ['email'],
            properties: {
                email: { type: 'string', example: 'colleague@linear.app' },
                name: { type: 'string', example: 'John Doe' },
                role: { type: 'string', enum: ['OWNER', 'ADMIN', 'MEMBER'], example: 'MEMBER' },
            },
        },
    }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "inviteMember", null);
__decorate([
    Get(':id/invitations'),
    ApiOperation({ summary: 'List pending workspace invitations (Owner/Admin only)' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getWorkspaceInvitations", null);
__decorate([
    Delete(':id/invitations/:invitationId'),
    ApiOperation({ summary: 'Cancel a pending workspace invitation (Owner/Admin only)' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiParam({ name: 'invitationId', description: 'Invitation ID' }),
    __param(0, Param('id')),
    __param(1, Param('invitationId')),
    __param(2, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "cancelInvitation", null);
__decorate([
    Patch(':id/members/:memberId'),
    ApiOperation({ summary: 'Update a member role' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiParam({ name: 'memberId', description: 'Member ID' }),
    ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: ['OWNER', 'ADMIN', 'MEMBER'] } } } }),
    __param(0, Param('id')),
    __param(1, Param('memberId')),
    __param(2, Body('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "updateMemberRole", null);
__decorate([
    Delete(':id/members/:memberId'),
    ApiOperation({ summary: 'Remove a member from the workspace' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiParam({ name: 'memberId', description: 'Member ID' }),
    __param(0, Param('id')),
    __param(1, Param('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "removeMember", null);
__decorate([
    Get(':id/sections'),
    ApiOperation({ summary: 'Get custom workflow sections/columns for a workspace' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getWorkspaceSections", null);
__decorate([
    Post(':id/sections'),
    ApiOperation({ summary: 'Create a custom workflow section/column' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiBody({
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
    }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "createWorkspaceSection", null);
__decorate([
    Delete(':id/sections/:sectionId'),
    ApiOperation({ summary: 'Delete a custom workflow section' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiParam({ name: 'sectionId', description: 'Section ID' }),
    __param(0, Param('id')),
    __param(1, Param('sectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "deleteWorkspaceSection", null);
__decorate([
    Patch(':id/columns'),
    ApiOperation({ summary: 'Update column ordering for board views' }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiBody({
        schema: {
            type: 'object',
            properties: {
                columnOrder: { type: 'array', items: { type: 'string' }, example: ['TODO', 'IN_PROGRESS', 'DONE'] },
            },
        },
    }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "updateColumnOrder", null);
WorkspacesController = __decorate([
    ApiTags('Workspaces'),
    ApiBearerAuth('JWT-auth'),
    UseGuards(JwtAuthGuard),
    Controller('workspaces'),
    __metadata("design:paramtypes", [WorkspacesService])
], WorkspacesController);
export { WorkspacesController };
//# sourceMappingURL=workspaces.controller.js.map