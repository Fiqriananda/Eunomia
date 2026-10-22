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
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, } from '@nestjs/swagger';
import { MobileService } from './mobile.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { MobileHomeQueryDto, MobileHomeResponseDto, } from './dto/mobile-home.dto.js';
import { MobileTasksQueryDto, MobilePaginatedTasksResponseDto, MobileCreateTaskDto, MobileUpdateTaskDto, MobileUpdateTaskStatusDto, MobileUpdateTaskPriorityDto, MobileUpdateAssigneeDto, MobileAssignCycleDto, MobileCreateSubtaskDto, MobileCreateRelationDto, MobileTaskRelationDto, MobileAddCommentDto, MobileUpdateCommentDto, MobileCommentDto, MobileToggleReactionDto, MobileTaskActivityDto, } from './dto/mobile-tasks.dto.js';
import { MobileTaskDetailDto } from './dto/mobile-task-detail.dto.js';
import { MobileNotificationsResponseDto } from './dto/mobile-notifications.dto.js';
import { MobileConfigResponseDto } from './dto/mobile-config.dto.js';
import { MobileWorkspaceListResponseDto, MobileWorkspaceMemberDto, MobileCreateWorkspaceDto, MobileInviteMemberDto, } from './dto/mobile-workspaces.dto.js';
import { MobileProjectDto, MobileCreateProjectDto, MobileUpdateProjectDto, MobileProjectDetailDto, } from './dto/mobile-projects.dto.js';
import { MobileCycleDto, MobileCreateCycleDto, MobileUpdateCycleDto, MobileCycleDetailDto, } from './dto/mobile-cycles.dto.js';
import { MobileTrashListResponseDto } from './dto/mobile-trash.dto.js';
import { MobileSearchQueryDto, MobileSearchResultDto, } from './dto/mobile-search.dto.js';
import { MobileProfileResponseDto, MobileUpdateProfileDto, MobileChangePasswordDto, MobileUserHoverCardDto, } from './dto/mobile-profile.dto.js';
import { MobileAdminPerformanceResponseDto } from './dto/mobile-performance.dto.js';
let MobileController = class MobileController {
    mobileService;
    constructor(mobileService) {
        this.mobileService = mobileService;
    }
    getConfig() {
        return this.mobileService.getConfig();
    }
    async getHome(userId, query) {
        return this.mobileService.getHome(userId, query);
    }
    async getWorkspaces(userId) {
        return this.mobileService.getWorkspaces(userId);
    }
    async createWorkspace(userId, dto) {
        return this.mobileService.createWorkspace(userId, dto);
    }
    async getWorkspaceMembers(workspaceId, userId) {
        return this.mobileService.getWorkspaceMembers(workspaceId, userId);
    }
    async inviteWorkspaceMember(workspaceId, userId, dto) {
        return this.mobileService.inviteWorkspaceMember(workspaceId, userId, dto);
    }
    async getProjects(userId, workspaceId) {
        return this.mobileService.getProjects(userId, workspaceId);
    }
    async createProject(userId, dto) {
        return this.mobileService.createProject(userId, dto);
    }
    async getProjectDetail(userId, projectId) {
        return this.mobileService.getProjectDetail(userId, projectId);
    }
    async updateProject(projectId, dto) {
        return this.mobileService.updateProject(projectId, dto);
    }
    async deleteProject(projectId) {
        return this.mobileService.deleteProject(projectId);
    }
    async getCycles(userId, workspaceId) {
        return this.mobileService.getCycles(userId, workspaceId);
    }
    async getCurrentCycle(userId, workspaceId) {
        return this.mobileService.getCurrentCycle(userId, workspaceId);
    }
    async createCycle(userId, dto) {
        return this.mobileService.createCycle(userId, dto);
    }
    async updateCycle(cycleId, dto) {
        return this.mobileService.updateCycle(cycleId, dto);
    }
    async getTasks(userId, query) {
        return this.mobileService.getTasks(userId, query);
    }
    async getTaskDetail(userId, taskId) {
        return this.mobileService.getTaskDetail(userId, taskId);
    }
    async createTask(userId, dto) {
        return this.mobileService.createTask(userId, dto);
    }
    async updateTask(userId, taskId, dto) {
        return this.mobileService.updateTask(userId, taskId, dto);
    }
    async updateStatus(userId, taskId, body) {
        return this.mobileService.updateTaskStatus(userId, taskId, body.status, body.customStatus);
    }
    async updatePriority(userId, taskId, body) {
        return this.mobileService.updateTaskPriority(userId, taskId, body.priority);
    }
    async updateAssignee(userId, taskId, body) {
        return this.mobileService.updateTaskAssignee(userId, taskId, body.assigneeId);
    }
    async assignCycle(userId, taskId, body) {
        return this.mobileService.assignTaskCycle(userId, taskId, body.cycleId);
    }
    async deleteTask(userId, taskId) {
        return this.mobileService.deleteTask(userId, taskId);
    }
    async getSubtasks(taskId) {
        return this.mobileService.getSubtasks(taskId);
    }
    async createSubtask(userId, parentTaskId, dto) {
        return this.mobileService.createSubtask(userId, parentTaskId, dto);
    }
    async getTaskRelations(taskId) {
        return this.mobileService.getTaskRelations(taskId);
    }
    async createTaskRelation(userId, taskId, dto) {
        return this.mobileService.createTaskRelation(userId, taskId, dto);
    }
    async deleteTaskRelation(userId, taskId, relationId) {
        return this.mobileService.deleteTaskRelation(userId, taskId, relationId);
    }
    async getTaskComments(taskId) {
        return this.mobileService.getTaskComments(taskId);
    }
    async addComment(userId, taskId, body) {
        return this.mobileService.addComment(userId, taskId, body.content);
    }
    async updateComment(userId, commentId, body) {
        return this.mobileService.updateComment(userId, commentId, body.content);
    }
    async deleteComment(userId, commentId) {
        return this.mobileService.deleteComment(userId, commentId);
    }
    async toggleTaskReaction(userId, taskId, body) {
        return this.mobileService.toggleTaskReaction(userId, taskId, body.emoji);
    }
    async toggleCommentReaction(userId, taskId, commentId, body) {
        return this.mobileService.toggleCommentReaction(userId, taskId, commentId, body.emoji);
    }
    async getTaskActivity(taskId) {
        return this.mobileService.getTaskActivities(taskId);
    }
    async getNotifications(userId, unreadOnly) {
        return this.mobileService.getNotifications(userId, unreadOnly === 'true');
    }
    async markNotificationRead(userId, id) {
        return this.mobileService.markNotificationRead(userId, id);
    }
    async markAllNotificationsRead(userId) {
        return this.mobileService.markAllNotificationsRead(userId);
    }
    async getTrash(userId, workspaceId) {
        return this.mobileService.getTrash(userId, workspaceId);
    }
    async restoreTask(userId, taskId) {
        return this.mobileService.restoreTaskFromTrash(userId, taskId);
    }
    async permanentDeleteTask(userId, taskId) {
        return this.mobileService.permanentDeleteTask(userId, taskId);
    }
    async search(userId, query) {
        return this.mobileService.search(userId, query);
    }
    async getProfile(userId) {
        return this.mobileService.getProfile(userId);
    }
    async updateProfile(userId, dto) {
        return this.mobileService.updateProfile(userId, dto);
    }
    async changePassword(userId, dto) {
        return this.mobileService.changePassword(userId, dto);
    }
    async getUserHoverCard(currentUserId, targetUserId, workspaceId) {
        return this.mobileService.getUserHoverCard(currentUserId, targetUserId, workspaceId);
    }
    async getAdminPerformance(userId, workspaceId, period) {
        return this.mobileService.getAdminPerformance(userId, workspaceId, period);
    }
};
__decorate([
    Get('config'),
    ApiOperation({
        summary: 'Get mobile app configuration and metadata',
        description: 'Returns metadata for client bootstrap: task statuses, priority levels with hex colors, supported emojis, and feature toggles.',
    }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Mobile initialization configuration',
        type: MobileConfigResponseDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", MobileConfigResponseDto)
], MobileController.prototype, "getConfig", null);
__decorate([
    Get('home'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Consolidated Mobile Home Feed & Dashboard',
        description: 'Returns user profile, active workspace, aggregate task counts, urgent/assigned tasks, and project summaries in a single mobile-optimized payload.',
    }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Consolidated mobile dashboard data',
        type: MobileHomeResponseDto,
    }),
    __param(0, CurrentUser('id')),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileHomeQueryDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getHome", null);
__decorate([
    Get('workspaces'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'List user workspaces',
        description: 'Returns all workspaces the user has access to with project and member counts.',
    }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Workspaces list',
        type: MobileWorkspaceListResponseDto,
    }),
    __param(0, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getWorkspaces", null);
__decorate([
    Post('workspaces'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Create a new workspace from mobile',
        description: 'Creates a workspace and assigns the current user as OWNER.',
    }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Workspace created successfully' }),
    __param(0, CurrentUser('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileCreateWorkspaceDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "createWorkspace", null);
__decorate([
    Get('workspaces/:id/members'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'List workspace members',
        description: 'Retrieves all teammates in a workspace with their roles, online presence, and avatar info.',
    }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'List of workspace members',
        type: [MobileWorkspaceMemberDto],
    }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getWorkspaceMembers", null);
__decorate([
    Post('workspaces/:id/invite'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Invite a member to workspace',
        description: 'Sends an email invitation or adds the member to the workspace.',
    }),
    ApiParam({ name: 'id', description: 'Workspace ID' }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Invitation sent' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileInviteMemberDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "inviteWorkspaceMember", null);
__decorate([
    Get('projects'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'List projects in workspace',
        description: 'Returns all projects with task completion metrics and progress percentages.',
    }),
    ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID (defaults to primary)' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'List of projects',
        type: [MobileProjectDto],
    }),
    __param(0, CurrentUser('id')),
    __param(1, Query('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getProjects", null);
__decorate([
    Post('projects'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Create a new project',
        description: 'Creates a project within a workspace with custom key prefix and color.',
    }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Project created' }),
    __param(0, CurrentUser('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileCreateProjectDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "createProject", null);
__decorate([
    Get('projects/:id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Get project detail with task breakdown',
        description: 'Returns full project details, status counts breakdown, and recent tasks.',
    }),
    ApiParam({ name: 'id', description: 'Project ID' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Project detail',
        type: MobileProjectDetailDto,
    }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getProjectDetail", null);
__decorate([
    Patch('projects/:id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Update project info',
        description: 'Update project name, key, description, or color theme.',
    }),
    ApiParam({ name: 'id', description: 'Project ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Project updated' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileUpdateProjectDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "updateProject", null);
__decorate([
    Delete('projects/:id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Delete project',
        description: 'Removes a project and cascades or cleans up related tasks.',
    }),
    ApiParam({ name: 'id', description: 'Project ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Project deleted' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "deleteProject", null);
__decorate([
    Get('cycles'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'List workspace cycles',
        description: 'Returns cycles with dates, status, and task progress.',
    }),
    ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'List of cycles',
        type: [MobileCycleDto],
    }),
    __param(0, CurrentUser('id')),
    __param(1, Query('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getCycles", null);
__decorate([
    Get('cycles/current'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Get current active cycle',
        description: 'Returns the currently active sprint/cycle with its compact task list.',
    }),
    ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Active cycle or null if none active',
        type: MobileCycleDetailDto,
    }),
    __param(0, CurrentUser('id')),
    __param(1, Query('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getCurrentCycle", null);
__decorate([
    Post('cycles'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Create a new cycle/sprint',
        description: 'Creates a cycle with start and end dates.',
    }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Cycle created' }),
    __param(0, CurrentUser('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileCreateCycleDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "createCycle", null);
__decorate([
    Patch('cycles/:id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Update cycle details or status',
        description: 'Update cycle dates, name, or change status to ACTIVE/COMPLETED.',
    }),
    ApiParam({ name: 'id', description: 'Cycle ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Cycle updated' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileUpdateCycleDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "updateCycle", null);
__decorate([
    Get('tasks'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Get mobile-optimized paginated tasks',
        description: 'Returns paginated list of tasks tailored for mobile cards with status, priority, subtask completion rates, and comment counts.',
    }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Paginated mobile task cards',
        type: MobilePaginatedTasksResponseDto,
    }),
    __param(0, CurrentUser('id')),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileTasksQueryDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getTasks", null);
__decorate([
    Get('tasks/:id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Get mobile task details',
        description: 'Returns complete detail for a single task including creator, assignee, breadcrumb parent, child subtasks, attachment links, and comments.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Detailed task information',
        type: MobileTaskDetailDto,
    }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getTaskDetail", null);
__decorate([
    Post('tasks'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Quick create task from mobile',
        description: 'Fast task creation with automatic workspace and project fallback defaults if not explicitly provided.',
    }),
    ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Task successfully created',
    }),
    __param(0, CurrentUser('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileCreateTaskDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "createTask", null);
__decorate([
    Patch('tasks/:id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Update task properties',
        description: 'Update title, description, priority, dates, estimates, or tags.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Task updated' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileUpdateTaskDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "updateTask", null);
__decorate([
    Patch('tasks/:id/status'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Quick status update (1-tap swipe/toggle)',
        description: 'Update the task status directly from mobile gestures or menus.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Task status updated' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileUpdateTaskStatusDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "updateStatus", null);
__decorate([
    Patch('tasks/:id/priority'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Quick priority update',
        description: 'Update the task priority from mobile picker.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Task priority updated' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileUpdateTaskPriorityDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "updatePriority", null);
__decorate([
    Patch('tasks/:id/assignee'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Assign or reassign task to team member',
        description: 'Pass assigneeId to assign, or null to unassign.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Task assignee updated' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileUpdateAssigneeDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "updateAssignee", null);
__decorate([
    Patch('tasks/:id/cycle'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Assign task to cycle/sprint',
        description: 'Assigns task to a sprint or sets to null to remove.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Task cycle updated' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileAssignCycleDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "assignCycle", null);
__decorate([
    Delete('tasks/:id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Move task to trash (soft delete)',
        description: 'Archives the task and moves it to workspace trash.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Task moved to trash' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "deleteTask", null);
__decorate([
    Get('tasks/:id/subtasks'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'List subtasks of a task',
        description: 'Returns subtask breakdown checklist with assignees and statuses.',
    }),
    ApiParam({ name: 'id', description: 'Parent Task ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'List of subtasks' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getSubtasks", null);
__decorate([
    Post('tasks/:id/subtasks'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Create a subtask under task',
        description: 'Adds a child task item under the parent.',
    }),
    ApiParam({ name: 'id', description: 'Parent Task ID' }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Subtask created' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileCreateSubtaskDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "createSubtask", null);
__decorate([
    Get('tasks/:id/relations'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Get task relations and blockers',
        description: 'Returns all related tasks (BLOCKS, BLOCKED_BY, RELATES_TO, DUPLICATE).',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'List of task relations',
        type: [MobileTaskRelationDto],
    }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getTaskRelations", null);
__decorate([
    Post('tasks/:id/relations'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Add relation between tasks',
        description: 'Link task to another task with BLOCKS, BLOCKED_BY, RELATES_TO, or DUPLICATE.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Relation added' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileCreateRelationDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "createTaskRelation", null);
__decorate([
    Delete('tasks/:id/relations/:relationId'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Delete task relation',
        description: 'Unlinks relationship between two tasks.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiParam({ name: 'relationId', description: 'Relation ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Relation removed' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Param('relationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "deleteTaskRelation", null);
__decorate([
    Get('tasks/:id/comments'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Get task comments with emoji reactions',
        description: 'Returns thread of comments and their reactions.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Task comments list',
        type: [MobileCommentDto],
    }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getTaskComments", null);
__decorate([
    Post('tasks/:id/comments'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Post comment on task from mobile',
        description: 'Add a comment to the task activity stream.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Comment created' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileAddCommentDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "addComment", null);
__decorate([
    Patch('tasks/:id/comments/:commentId'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Edit comment',
        description: 'Update existing comment content.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiParam({ name: 'commentId', description: 'Comment ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Comment updated' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('commentId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileUpdateCommentDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "updateComment", null);
__decorate([
    Delete('tasks/:id/comments/:commentId'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Delete comment',
        description: 'Removes comment from the task.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiParam({ name: 'commentId', description: 'Comment ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Comment deleted' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "deleteComment", null);
__decorate([
    Post('tasks/:id/reactions'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Toggle reaction on task',
        description: 'Adds or removes an emoji reaction on the task header.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Reaction toggled' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, MobileToggleReactionDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "toggleTaskReaction", null);
__decorate([
    Post('tasks/:id/comments/:commentId/reactions'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Toggle reaction on task comment',
        description: 'Adds or removes an emoji reaction on a specific comment.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiParam({ name: 'commentId', description: 'Comment ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Reaction toggled' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Param('commentId')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, MobileToggleReactionDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "toggleCommentReaction", null);
__decorate([
    Get('tasks/:id/activity'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Get task audit & activity trail',
        description: 'Returns chronological history of edits, assignments, status changes, and comments.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Activity stream',
        type: [MobileTaskActivityDto],
    }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getTaskActivity", null);
__decorate([
    Get('notifications'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Get mobile inbox notifications',
        description: 'Retrieve notification list and badge count for mobile bell icon.',
    }),
    ApiQuery({
        name: 'unreadOnly',
        required: false,
        type: Boolean,
        description: 'Filter only unread notifications',
    }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Inbox notification stream and unread badge count',
        type: MobileNotificationsResponseDto,
    }),
    __param(0, CurrentUser('id')),
    __param(1, Query('unreadOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getNotifications", null);
__decorate([
    Patch('notifications/:id/read'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Mark single notification as read',
        description: 'Dismiss/read a notification when tapped on mobile.',
    }),
    ApiParam({ name: 'id', description: 'Notification ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Notification marked as read' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "markNotificationRead", null);
__decorate([
    Post('notifications/read-all'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
        summary: 'Mark all notifications as read',
        description: 'Clears unread badge count across all mobile notifications.',
    }),
    ApiResponse({ status: HttpStatus.OK, description: 'All notifications marked as read' }),
    __param(0, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "markAllNotificationsRead", null);
__decorate([
    Get('trash'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'List deleted tasks in trash',
        description: 'Returns archived/trashed tasks in the workspace with deleted timestamp.',
    }),
    ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Trashed tasks list',
        type: MobileTrashListResponseDto,
    }),
    __param(0, CurrentUser('id')),
    __param(1, Query('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getTrash", null);
__decorate([
    Post('trash/:id/restore'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Restore task from trash',
        description: 'Restores a trashed task back to active status.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Task restored successfully' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "restoreTask", null);
__decorate([
    Delete('trash/:id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Permanently purge task from trash',
        description: 'Permanently deletes task and all related comments, attachments and activity records.',
    }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Task permanently deleted' }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "permanentDeleteTask", null);
__decorate([
    Get('search'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Fast universal search across tasks, projects, and teammates',
        description: 'Single search query returning matched tasks, projects, and members.',
    }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Search results across entities',
        type: MobileSearchResultDto,
    }),
    __param(0, CurrentUser('id')),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileSearchQueryDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "search", null);
__decorate([
    Get('profile'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Get current user profile & stats',
        description: 'Returns authenticated user info, avatar, and task completion metrics.',
    }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'User profile with stats',
        type: MobileProfileResponseDto,
    }),
    __param(0, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getProfile", null);
__decorate([
    Patch('profile'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Update current user profile',
        description: 'Update name or avatar URL.',
    }),
    ApiResponse({ status: HttpStatus.OK, description: 'Profile updated' }),
    __param(0, CurrentUser('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileUpdateProfileDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "updateProfile", null);
__decorate([
    Patch('profile/password'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Change password',
        description: 'Validate current password and set new password.',
    }),
    ApiResponse({ status: HttpStatus.OK, description: 'Password changed successfully' }),
    __param(0, CurrentUser('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MobileChangePasswordDto]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "changePassword", null);
__decorate([
    Get('users/:id/hover-card'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Get user hover-card / profile sheet popup data',
        description: 'Provides rich hover popup data including initials, avatar accent color, role/title, local time, and handle.',
    }),
    ApiParam({ name: 'id', description: 'Target user ID' }),
    ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID' }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'User hover-card data',
        type: MobileUserHoverCardDto,
    }),
    __param(0, CurrentUser('id')),
    __param(1, Param('id')),
    __param(2, Query('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getUserHoverCard", null);
__decorate([
    Get('admin/performance'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
        summary: 'Admin Only: Performance Indicators based on finished/completed tasks',
        description: 'Provides deep team productivity metrics, member completion leaderboard, project breakdown, and velocity based on finished tasks. Restricted exclusively to workspace ADMIN and OWNER roles.',
    }),
    ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID (defaults to active)' }),
    ApiQuery({
        name: 'period',
        required: false,
        enum: ['all', 'this_week', 'this_month'],
        description: 'Time window filter (all, this_week, this_month)',
    }),
    ApiResponse({
        status: HttpStatus.OK,
        description: 'Admin team performance indicators',
        type: MobileAdminPerformanceResponseDto,
    }),
    ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Forbidden - only workspace admins and owners can access this endpoint',
    }),
    __param(0, CurrentUser('id')),
    __param(1, Query('workspaceId')),
    __param(2, Query('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getAdminPerformance", null);
MobileController = __decorate([
    ApiTags('Mobile'),
    Controller('mobile'),
    __metadata("design:paramtypes", [MobileService])
], MobileController);
export { MobileController };
//# sourceMappingURL=mobile.controller.js.map