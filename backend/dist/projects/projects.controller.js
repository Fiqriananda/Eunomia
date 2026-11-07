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
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ProjectsService } from './projects.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
let ProjectsController = class ProjectsController {
    projectsService;
    constructor(projectsService) {
        this.projectsService = projectsService;
    }
    async getProjects(workspaceId) {
        return this.projectsService.getProjectsByWorkspace(workspaceId);
    }
    async getProject(id) {
        return this.projectsService.getProjectById(id);
    }
    async createProject(body) {
        return this.projectsService.createProject(body.workspaceId, body);
    }
    async updateProject(id, body) {
        return this.projectsService.updateProject(id, body);
    }
    async deleteProject(id) {
        return this.projectsService.deleteProject(id);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all projects within a workspace' }),
    ApiQuery({ name: 'workspaceId', required: true, description: 'Workspace ID' }),
    ApiResponse({ status: 200, description: 'List of projects with task counts and epic breakdown' }),
    __param(0, Query('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getProjects", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get a project by ID with detailed task list' }),
    ApiParam({ name: 'id', description: 'Project ID' }),
    ApiResponse({ status: 200, description: 'Project detail' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getProject", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new project / Epic' }),
    ApiBody({
        schema: {
            type: 'object',
            required: ['workspaceId', 'name'],
            properties: {
                workspaceId: { type: 'string', example: 'ws_123' },
                name: { type: 'string', example: 'PDF Schedule Uploader' },
                key: { type: 'string', example: 'PDF' },
                description: { type: 'string', example: 'Automatic PDF schedule parser and uploader' },
                color: { type: 'string', example: '#6366f1' },
                status: { type: 'string', example: 'IN_PROGRESS' },
                targetDate: { type: 'string', example: '2026-12-31' },
                leadId: { type: 'string', example: 'user_123' },
            },
        },
    }),
    ApiResponse({ status: 201, description: 'Project created' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "createProject", null);
__decorate([
    Patch(':id'),
    ApiOperation({ summary: 'Update project properties' }),
    ApiParam({ name: 'id', description: 'Project ID' }),
    ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'PDF Schedule Uploader v2' },
                key: { type: 'string', example: 'PDF' },
                description: { type: 'string', example: 'Updated project description' },
                color: { type: 'string', example: '#10b981' },
                status: { type: 'string', example: 'COMPLETED' },
                targetDate: { type: 'string', example: '2026-12-31' },
                leadId: { type: 'string', example: 'user_123' },
            },
        },
    }),
    ApiResponse({ status: 200, description: 'Project updated' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "updateProject", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete a project' }),
    ApiParam({ name: 'id', description: 'Project ID' }),
    ApiResponse({ status: 200, description: 'Project deleted' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "deleteProject", null);
ProjectsController = __decorate([
    ApiTags('Projects'),
    ApiBearerAuth('JWT-auth'),
    UseGuards(JwtAuthGuard),
    Controller('projects'),
    __metadata("design:paramtypes", [ProjectsService])
], ProjectsController);
export { ProjectsController };
//# sourceMappingURL=projects.controller.js.map