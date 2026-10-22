import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MobileService } from './mobile.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

// DTOs
import {
  MobileHomeQueryDto,
  MobileHomeResponseDto,
} from './dto/mobile-home.dto.js';
import {
  MobileTasksQueryDto,
  MobilePaginatedTasksResponseDto,
  MobileCreateTaskDto,
  MobileUpdateTaskDto,
  MobileUpdateTaskStatusDto,
  MobileUpdateTaskPriorityDto,
  MobileUpdateAssigneeDto,
  MobileAssignCycleDto,
  MobileCreateSubtaskDto,
  MobileCreateRelationDto,
  MobileTaskRelationDto,
  MobileAddCommentDto,
  MobileUpdateCommentDto,
  MobileCommentDto,
  MobileToggleReactionDto,
  MobileTaskActivityDto,
} from './dto/mobile-tasks.dto.js';
import { MobileTaskDetailDto } from './dto/mobile-task-detail.dto.js';
import { MobileNotificationsResponseDto } from './dto/mobile-notifications.dto.js';
import { MobileConfigResponseDto } from './dto/mobile-config.dto.js';
import {
  MobileWorkspaceListResponseDto,
  MobileWorkspaceMemberDto,
  MobileCreateWorkspaceDto,
  MobileInviteMemberDto,
} from './dto/mobile-workspaces.dto.js';
import {
  MobileProjectDto,
  MobileCreateProjectDto,
  MobileUpdateProjectDto,
  MobileProjectDetailDto,
} from './dto/mobile-projects.dto.js';
import {
  MobileCycleDto,
  MobileCreateCycleDto,
  MobileUpdateCycleDto,
  MobileCycleDetailDto,
} from './dto/mobile-cycles.dto.js';
import { MobileTrashListResponseDto } from './dto/mobile-trash.dto.js';
import {
  MobileSearchQueryDto,
  MobileSearchResultDto,
} from './dto/mobile-search.dto.js';
import {
  MobileProfileResponseDto,
  MobileUpdateProfileDto,
  MobileChangePasswordDto,
  MobileUserHoverCardDto,
} from './dto/mobile-profile.dto.js';

@ApiTags('Mobile')
@Controller('mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  // ==========================================
  // 1. CONFIG & METADATA
  // ==========================================
  @Get('config')
  @ApiOperation({
    summary: 'Get mobile app configuration and metadata',
    description:
      'Returns metadata for client bootstrap: task statuses, priority levels with hex colors, supported emojis, and feature toggles.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mobile initialization configuration',
    type: MobileConfigResponseDto,
  })
  getConfig(): MobileConfigResponseDto {
    return this.mobileService.getConfig();
  }

  // ==========================================
  // 2. CONSOLIDATED HOME FEED
  // ==========================================
  @Get('home')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Consolidated Mobile Home Feed & Dashboard',
    description:
      'Returns user profile, active workspace, aggregate task counts, urgent/assigned tasks, and project summaries in a single mobile-optimized payload.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Consolidated mobile dashboard data',
    type: MobileHomeResponseDto,
  })
  async getHome(
    @CurrentUser('id') userId: string,
    @Query() query: MobileHomeQueryDto,
  ): Promise<MobileHomeResponseDto> {
    return this.mobileService.getHome(userId, query);
  }

  // ==========================================
  // 3. WORKSPACES & MEMBERS
  // ==========================================
  @Get('workspaces')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List user workspaces',
    description: 'Returns all workspaces the user has access to with project and member counts.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workspaces list',
    type: MobileWorkspaceListResponseDto,
  })
  async getWorkspaces(@CurrentUser('id') userId: string): Promise<MobileWorkspaceListResponseDto> {
    return this.mobileService.getWorkspaces(userId);
  }

  @Post('workspaces')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new workspace from mobile',
    description: 'Creates a workspace and assigns the current user as OWNER.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Workspace created successfully' })
  async createWorkspace(
    @CurrentUser('id') userId: string,
    @Body() dto: MobileCreateWorkspaceDto,
  ) {
    return this.mobileService.createWorkspace(userId, dto);
  }

  @Get('workspaces/:id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List workspace members',
    description: 'Retrieves all teammates in a workspace with their roles, online presence, and avatar info.',
  })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of workspace members',
    type: [MobileWorkspaceMemberDto],
  })
  async getWorkspaceMembers(
    @Param('id') workspaceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<MobileWorkspaceMemberDto[]> {
    return this.mobileService.getWorkspaceMembers(workspaceId, userId);
  }

  @Post('workspaces/:id/invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Invite a member to workspace',
    description: 'Sends an email invitation or adds the member to the workspace.',
  })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Invitation sent' })
  async inviteWorkspaceMember(
    @Param('id') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: MobileInviteMemberDto,
  ) {
    return this.mobileService.inviteWorkspaceMember(workspaceId, userId, dto);
  }

  // ==========================================
  // 4. PROJECTS
  // ==========================================
  @Get('projects')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List projects in workspace',
    description: 'Returns all projects with task completion metrics and progress percentages.',
  })
  @ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID (defaults to primary)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of projects',
    type: [MobileProjectDto],
  })
  async getProjects(
    @CurrentUser('id') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<MobileProjectDto[]> {
    return this.mobileService.getProjects(userId, workspaceId);
  }

  @Post('projects')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Creates a project within a workspace with custom key prefix and color.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Project created' })
  async createProject(
    @CurrentUser('id') userId: string,
    @Body() dto: MobileCreateProjectDto,
  ) {
    return this.mobileService.createProject(userId, dto);
  }

  @Get('projects/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get project detail with task breakdown',
    description: 'Returns full project details, status counts breakdown, and recent tasks.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project detail',
    type: MobileProjectDetailDto,
  })
  async getProjectDetail(
    @CurrentUser('id') userId: string,
    @Param('id') projectId: string,
  ): Promise<MobileProjectDetailDto> {
    return this.mobileService.getProjectDetail(userId, projectId);
  }

  @Patch('projects/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update project info',
    description: 'Update project name, key, description, or color theme.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project updated' })
  async updateProject(
    @Param('id') projectId: string,
    @Body() dto: MobileUpdateProjectDto,
  ) {
    return this.mobileService.updateProject(projectId, dto);
  }

  @Delete('projects/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete project',
    description: 'Removes a project and cascades or cleans up related tasks.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project deleted' })
  async deleteProject(@Param('id') projectId: string) {
    return this.mobileService.deleteProject(projectId);
  }

  // ==========================================
  // 5. CYCLES (SPRINTS)
  // ==========================================
  @Get('cycles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List workspace cycles',
    description: 'Returns cycles with dates, status, and task progress.',
  })
  @ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of cycles',
    type: [MobileCycleDto],
  })
  async getCycles(
    @CurrentUser('id') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<MobileCycleDto[]> {
    return this.mobileService.getCycles(userId, workspaceId);
  }

  @Get('cycles/current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current active cycle',
    description: 'Returns the currently active sprint/cycle with its compact task list.',
  })
  @ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active cycle or null if none active',
    type: MobileCycleDetailDto,
  })
  async getCurrentCycle(
    @CurrentUser('id') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<MobileCycleDetailDto | null> {
    return this.mobileService.getCurrentCycle(userId, workspaceId);
  }

  @Post('cycles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new cycle/sprint',
    description: 'Creates a cycle with start and end dates.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Cycle created' })
  async createCycle(
    @CurrentUser('id') userId: string,
    @Body() dto: MobileCreateCycleDto,
  ) {
    return this.mobileService.createCycle(userId, dto);
  }

  @Patch('cycles/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update cycle details or status',
    description: 'Update cycle dates, name, or change status to ACTIVE/COMPLETED.',
  })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cycle updated' })
  async updateCycle(
    @Param('id') cycleId: string,
    @Body() dto: MobileUpdateCycleDto,
  ) {
    return this.mobileService.updateCycle(cycleId, dto);
  }

  // ==========================================
  // 6. TASKS & FILTERING
  // ==========================================
  @Get('tasks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get mobile-optimized paginated tasks',
    description:
      'Returns paginated list of tasks tailored for mobile cards with status, priority, subtask completion rates, and comment counts.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated mobile task cards',
    type: MobilePaginatedTasksResponseDto,
  })
  async getTasks(
    @CurrentUser('id') userId: string,
    @Query() query: MobileTasksQueryDto,
  ): Promise<MobilePaginatedTasksResponseDto> {
    return this.mobileService.getTasks(userId, query);
  }

  @Get('tasks/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get mobile task details',
    description:
      'Returns complete detail for a single task including creator, assignee, breadcrumb parent, child subtasks, attachment links, and comments.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detailed task information',
    type: MobileTaskDetailDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found' })
  async getTaskDetail(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
  ): Promise<MobileTaskDetailDto> {
    return this.mobileService.getTaskDetail(userId, taskId);
  }

  @Post('tasks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Quick create task from mobile',
    description:
      'Fast task creation with automatic workspace and project fallback defaults if not explicitly provided.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Task successfully created',
  })
  async createTask(
    @CurrentUser('id') userId: string,
    @Body() dto: MobileCreateTaskDto,
  ) {
    return this.mobileService.createTask(userId, dto);
  }

  @Patch('tasks/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update task properties',
    description: 'Update title, description, priority, dates, estimates, or tags.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task updated' })
  async updateTask(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() dto: MobileUpdateTaskDto,
  ) {
    return this.mobileService.updateTask(userId, taskId, dto);
  }

  @Patch('tasks/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Quick status update (1-tap swipe/toggle)',
    description: 'Update the task status directly from mobile gestures or menus.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task status updated' })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() body: MobileUpdateTaskStatusDto,
  ) {
    return this.mobileService.updateTaskStatus(
      userId,
      taskId,
      body.status,
      body.customStatus,
    );
  }

  @Patch('tasks/:id/priority')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Quick priority update',
    description: 'Update the task priority from mobile picker.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task priority updated' })
  async updatePriority(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() body: MobileUpdateTaskPriorityDto,
  ) {
    return this.mobileService.updateTaskPriority(userId, taskId, body.priority);
  }

  @Patch('tasks/:id/assignee')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Assign or reassign task to team member',
    description: 'Pass assigneeId to assign, or null to unassign.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task assignee updated' })
  async updateAssignee(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() body: MobileUpdateAssigneeDto,
  ) {
    return this.mobileService.updateTaskAssignee(userId, taskId, body.assigneeId);
  }

  @Patch('tasks/:id/cycle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Assign task to cycle/sprint',
    description: 'Assigns task to a sprint or sets to null to remove.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task cycle updated' })
  async assignCycle(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() body: MobileAssignCycleDto,
  ) {
    return this.mobileService.assignTaskCycle(userId, taskId, body.cycleId);
  }

  @Delete('tasks/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Move task to trash (soft delete)',
    description: 'Archives the task and moves it to workspace trash.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task moved to trash' })
  async deleteTask(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
  ) {
    return this.mobileService.deleteTask(userId, taskId);
  }

  // ==========================================
  // 7. SUBTASKS
  // ==========================================
  @Get('tasks/:id/subtasks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List subtasks of a task',
    description: 'Returns subtask breakdown checklist with assignees and statuses.',
  })
  @ApiParam({ name: 'id', description: 'Parent Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of subtasks' })
  async getSubtasks(@Param('id') taskId: string) {
    return this.mobileService.getSubtasks(taskId);
  }

  @Post('tasks/:id/subtasks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a subtask under task',
    description: 'Adds a child task item under the parent.',
  })
  @ApiParam({ name: 'id', description: 'Parent Task ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Subtask created' })
  async createSubtask(
    @CurrentUser('id') userId: string,
    @Param('id') parentTaskId: string,
    @Body() dto: MobileCreateSubtaskDto,
  ) {
    return this.mobileService.createSubtask(userId, parentTaskId, dto);
  }

  // ==========================================
  // 8. RELATIONS (DEPENDENCIES & BLOCKERS)
  // ==========================================
  @Get('tasks/:id/relations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get task relations and blockers',
    description: 'Returns all related tasks (BLOCKS, BLOCKED_BY, RELATES_TO, DUPLICATE).',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of task relations',
    type: [MobileTaskRelationDto],
  })
  async getTaskRelations(@Param('id') taskId: string): Promise<MobileTaskRelationDto[]> {
    return this.mobileService.getTaskRelations(taskId);
  }

  @Post('tasks/:id/relations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Add relation between tasks',
    description: 'Link task to another task with BLOCKS, BLOCKED_BY, RELATES_TO, or DUPLICATE.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Relation added' })
  async createTaskRelation(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() dto: MobileCreateRelationDto,
  ) {
    return this.mobileService.createTaskRelation(userId, taskId, dto);
  }

  @Delete('tasks/:id/relations/:relationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete task relation',
    description: 'Unlinks relationship between two tasks.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'relationId', description: 'Relation ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relation removed' })
  async deleteTaskRelation(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Param('relationId') relationId: string,
  ) {
    return this.mobileService.deleteTaskRelation(userId, taskId, relationId);
  }

  // ==========================================
  // 9. COMMENTS, REACTIONS & ACTIVITY
  // ==========================================
  @Get('tasks/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get task comments with emoji reactions',
    description: 'Returns thread of comments and their reactions.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task comments list',
    type: [MobileCommentDto],
  })
  async getTaskComments(@Param('id') taskId: string): Promise<MobileCommentDto[]> {
    return this.mobileService.getTaskComments(taskId);
  }

  @Post('tasks/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Post comment on task from mobile',
    description: 'Add a comment to the task activity stream.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Comment created' })
  async addComment(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() body: MobileAddCommentDto,
  ) {
    return this.mobileService.addComment(userId, taskId, body.content);
  }

  @Patch('tasks/:id/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Edit comment',
    description: 'Update existing comment content.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comment updated' })
  async updateComment(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
    @Body() body: MobileUpdateCommentDto,
  ) {
    return this.mobileService.updateComment(userId, commentId, body.content);
  }

  @Delete('tasks/:id/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete comment',
    description: 'Removes comment from the task.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comment deleted' })
  async deleteComment(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.mobileService.deleteComment(userId, commentId);
  }

  @Post('tasks/:id/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Toggle reaction on task',
    description: 'Adds or removes an emoji reaction on the task header.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Reaction toggled' })
  async toggleTaskReaction(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() body: MobileToggleReactionDto,
  ) {
    return this.mobileService.toggleTaskReaction(userId, taskId, body.emoji);
  }

  @Post('tasks/:id/comments/:commentId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Toggle reaction on task comment',
    description: 'Adds or removes an emoji reaction on a specific comment.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Reaction toggled' })
  async toggleCommentReaction(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Param('commentId') commentId: string,
    @Body() body: MobileToggleReactionDto,
  ) {
    return this.mobileService.toggleCommentReaction(userId, taskId, commentId, body.emoji);
  }

  @Get('tasks/:id/activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get task audit & activity trail',
    description: 'Returns chronological history of edits, assignments, status changes, and comments.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activity stream',
    type: [MobileTaskActivityDto],
  })
  async getTaskActivity(@Param('id') taskId: string): Promise<MobileTaskActivityDto[]> {
    return this.mobileService.getTaskActivities(taskId);
  }

  // ==========================================
  // 10. NOTIFICATIONS
  // ==========================================
  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get mobile inbox notifications',
    description: 'Retrieve notification list and badge count for mobile bell icon.',
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'Filter only unread notifications',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inbox notification stream and unread badge count',
    type: MobileNotificationsResponseDto,
  })
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ): Promise<MobileNotificationsResponseDto> {
    return this.mobileService.getNotifications(userId, unreadOnly === 'true');
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mark single notification as read',
    description: 'Dismiss/read a notification when tapped on mobile.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification marked as read' })
  async markNotificationRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.mobileService.markNotificationRead(userId, id);
  }

  @Post('notifications/read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Clears unread badge count across all mobile notifications.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'All notifications marked as read' })
  async markAllNotificationsRead(@CurrentUser('id') userId: string) {
    return this.mobileService.markAllNotificationsRead(userId);
  }

  // ==========================================
  // 11. TRASH & RESTORE
  // ==========================================
  @Get('trash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List deleted tasks in trash',
    description: 'Returns archived/trashed tasks in the workspace with deleted timestamp.',
  })
  @ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trashed tasks list',
    type: MobileTrashListResponseDto,
  })
  async getTrash(
    @CurrentUser('id') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<MobileTrashListResponseDto> {
    return this.mobileService.getTrash(userId, workspaceId);
  }

  @Post('trash/:id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Restore task from trash',
    description: 'Restores a trashed task back to active status.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task restored successfully' })
  async restoreTask(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
  ) {
    return this.mobileService.restoreTaskFromTrash(userId, taskId);
  }

  @Delete('trash/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Permanently purge task from trash',
    description: 'Permanently deletes task and all related comments, attachments and activity records.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task permanently deleted' })
  async permanentDeleteTask(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
  ) {
    return this.mobileService.permanentDeleteTask(userId, taskId);
  }

  // ==========================================
  // 12. UNIVERSAL SEARCH
  // ==========================================
  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Fast universal search across tasks, projects, and teammates',
    description: 'Single search query returning matched tasks, projects, and members.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results across entities',
    type: MobileSearchResultDto,
  })
  async search(
    @CurrentUser('id') userId: string,
    @Query() query: MobileSearchQueryDto,
  ): Promise<MobileSearchResultDto> {
    return this.mobileService.search(userId, query);
  }

  // ==========================================
  // 13. USER PROFILE & HOVER CARD
  // ==========================================
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile & stats',
    description: 'Returns authenticated user info, avatar, and task completion metrics.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile with stats',
    type: MobileProfileResponseDto,
  })
  async getProfile(@CurrentUser('id') userId: string): Promise<MobileProfileResponseDto> {
    return this.mobileService.getProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update name or avatar URL.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: MobileUpdateProfileDto,
  ) {
    return this.mobileService.updateProfile(userId, dto);
  }

  @Patch('profile/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change password',
    description: 'Validate current password and set new password.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password changed successfully' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: MobileChangePasswordDto,
  ) {
    return this.mobileService.changePassword(userId, dto);
  }

  @Get('users/:id/hover-card')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user hover-card / profile sheet popup data',
    description:
      'Provides rich hover popup data including initials, avatar accent color, role/title, local time, and handle.',
  })
  @ApiParam({ name: 'id', description: 'Target user ID' })
  @ApiQuery({ name: 'workspaceId', required: false, description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User hover-card data',
    type: MobileUserHoverCardDto,
  })
  async getUserHoverCard(
    @CurrentUser('id') currentUserId: string,
    @Param('id') targetUserId: string,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<MobileUserHoverCardDto> {
    return this.mobileService.getUserHoverCard(currentUserId, targetUserId, workspaceId);
  }
}
