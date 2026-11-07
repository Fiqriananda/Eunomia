import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ProjectsService } from './projects.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects within a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true, description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'List of projects with task counts and epic breakdown' })
  async getProjects(@Query('workspaceId') workspaceId: string) {
    return this.projectsService.getProjectsByWorkspace(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID with detailed task list' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project detail' })
  async getProject(@Param('id') id: string) {
    return this.projectsService.getProjectById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project / Epic' })
  @ApiBody({
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
  })
  @ApiResponse({ status: 201, description: 'Project created' })
  async createProject(
    @Body()
    body: {
      workspaceId: string;
      name: string;
      key?: string;
      description?: string;
      color?: string;
      status?: string;
      targetDate?: string;
      leadId?: string;
    },
  ) {
    return this.projectsService.createProject(body.workspaceId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project properties' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiBody({
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
  })
  @ApiResponse({ status: 200, description: 'Project updated' })
  async updateProject(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      key?: string;
      description?: string;
      color?: string;
      status?: string;
      targetDate?: string | null;
      leadId?: string | null;
    },
  ) {
    return this.projectsService.updateProject(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  async deleteProject(@Param('id') id: string) {
    return this.projectsService.deleteProject(id);
  }
}

