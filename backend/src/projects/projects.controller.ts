import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
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
  @ApiResponse({ status: 200, description: 'List of projects with task counts' })
  async getProjects(@Query('workspaceId') workspaceId: string) {
    return this.projectsService.getProjectsByWorkspace(workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['workspaceId', 'name', 'key'],
      properties: {
        workspaceId: { type: 'string', example: 'ws_123' },
        name: { type: 'string', example: 'Mobile App' },
        key: { type: 'string', example: 'MOB' },
        description: { type: 'string', example: 'Native iOS & Android mobile application' },
        color: { type: 'string', example: '#6366f1' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Project created' })
  async createProject(
    @Body() body: { workspaceId: string; name: string; key: string; description?: string; color?: string },
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
        name: { type: 'string', example: 'Mobile App v2' },
        key: { type: 'string', example: 'MOB' },
        description: { type: 'string', example: 'Updated project description' },
        color: { type: 'string', example: '#10b981' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Project updated' })
  async updateProject(
    @Param('id') id: string,
    @Body() body: { name?: string; key?: string; description?: string; color?: string },
  ) {
    return this.projectsService.updateProject(id, body);
  }
}
