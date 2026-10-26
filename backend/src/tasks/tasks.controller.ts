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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { TaskStatus, TaskPriority, TriageStatus } from '@prisma/client';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of tasks with filters (including cycles, divisions, and archived trash)' })
  @ApiQuery({ name: 'workspaceId', required: true, description: 'Workspace ID' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project' })
  @ApiQuery({ name: 'cycleId', required: false, description: 'Filter by cycle/sprint' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriority, description: 'Filter by priority' })
  @ApiQuery({ name: 'assigneeId', required: false, description: 'Filter by assignee' })
  @ApiQuery({ name: 'search', required: false, description: 'Text search' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Parent task ID' })
  @ApiQuery({ name: 'archived', required: false, description: 'Set to "true" to view trash / archived tasks' })
  @ApiQuery({ name: 'requesterDivisionId', required: false, description: 'Filter by requester division' })
  @ApiQuery({ name: 'assignedDivisionId', required: false, description: 'Filter by assigned division' })
  @ApiQuery({ name: 'triageStatus', required: false, description: 'Filter by triage status' })
  @ApiQuery({ name: 'includePendingTriage', required: false, description: 'Include pending triage requests' })
  async getTasks(
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
    @Query('cycleId') cycleId?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
    @Query('parentId') parentId?: string,
    @Query('archived') archived?: string,
    @Query('requesterDivisionId') requesterDivisionId?: string,
    @Query('assignedDivisionId') assignedDivisionId?: string,
    @Query('triageStatus') triageStatus?: TriageStatus | 'ALL',
    @Query('includePendingTriage') includePendingTriage?: string,
  ) {
    return this.tasksService.getTasks({
      workspaceId,
      projectId,
      cycleId,
      status,
      priority,
      assigneeId,
      search,
      parentId,
      archived,
      requesterDivisionId,
      assignedDivisionId,
      triageStatus,
      includePendingTriage,
    });
  }

  @Get('triage')
  @ApiOperation({ summary: 'Get incoming intake requests waiting for triage review' })
  @ApiQuery({ name: 'workspaceId', required: true, description: 'Workspace ID' })
  async getTriageRequests(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.getTriageRequests(workspaceId, userId);
  }

  @Post('intake')
  @ApiOperation({ summary: 'Submit an intake request from a division' })
  async createIntakeRequest(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      workspaceId: string;
      title: string;
      requesterDivisionId?: string;
      customDivisionName?: string;
      description: string;
      urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
      targetDeadline?: string;
      assetLinks?: string;
      businessObjective?: string;
      targetAudience?: string;
    },
  ) {
    return this.tasksService.createIntakeRequest(userId, body);
  }

  @Patch(':id/triage')
  @ApiOperation({ summary: 'Approve or reject a request in triage review' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async updateTriageStatus(
    @Param('id') taskId: string,
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      action: 'APPROVE' | 'REJECT' | 'RESUBMIT';
      priority?: TaskPriority;
      estimate?: number;
      cycleId?: string | null;
      status?: TaskStatus;
      comment?: string;
    },
  ) {
    return this.tasksService.updateTriageStatus(taskId, userId, body.action, {
      priority: body.priority,
      estimate: body.estimate,
      cycleId: body.cycleId,
      status: body.status,
      comment: body.comment,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async getTaskById(@Param('id') id: string) {
    return this.tasksService.getTaskById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      workspaceId: string;
      projectId: string;
      title: string;
      description?: string;
      status?: TaskStatus;
      customStatus?: string | null;
      priority?: TaskPriority;
      assigneeId?: string;
      dueDate?: string;
      labels?: string[];
      parentId?: string | null;
      cycleId?: string | null;
      estimate?: number;
    },
  ) {
    return this.tasksService.createTask(userId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task properties' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async updateTask(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      customStatus?: string | null;
      priority?: TaskPriority;
      assigneeId?: string | null;
      dueDate?: string | null;
      labels?: string[];
      projectId?: string;
      identifier?: string;
      parentId?: string | null;
      cycleId?: string | null;
      estimate?: number;
      isArchived?: boolean;
    },
  ) {
    return this.tasksService.updateTask(id, body, userId);
  }

  @Post(':id/subtasks')
  @ApiOperation({ summary: 'Create a subtask for a parent task' })
  @ApiParam({ name: 'id', description: 'Parent task ID' })
  async createSubTask(
    @Param('id') parentId: string,
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      title: string;
      description?: string;
      status?: TaskStatus;
      customStatus?: string | null;
      priority?: TaskPriority;
      assigneeId?: string;
      dueDate?: string;
      labels?: string[];
      projectId?: string;
    },
  ) {
    return this.tasksService.createSubTask(parentId, userId, body);
  }

  @Post(':id/link-subtask')
  @ApiOperation({ summary: 'Link an existing task as subtask' })
  @ApiParam({ name: 'id', description: 'Parent task ID' })
  async linkSubTask(
    @Param('id') parentId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { subTaskId: string },
  ) {
    return this.tasksService.linkSubTask(parentId, body.subTaskId, userId);
  }

  @Delete(':id/subtasks/:subTaskId')
  @ApiOperation({ summary: 'Unlink subtask from parent' })
  @ApiParam({ name: 'id', description: 'Parent task ID' })
  @ApiParam({ name: 'subTaskId', description: 'Subtask ID' })
  async unlinkSubTask(
    @Param('id') parentId: string,
    @Param('subTaskId') subTaskId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.unlinkSubTask(parentId, subTaskId, userId);
  }

  @Post(':id/relations')
  @ApiOperation({ summary: 'Add relation between tasks (Blocks, Related, Duplicate)' })
  @ApiParam({ name: 'id', description: 'Source task ID' })
  async addRelation(
    @Param('id') taskId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { targetTaskId: string; type?: string },
  ) {
    return this.tasksService.addRelation(taskId, userId, body);
  }

  @Delete(':id/relations/:relationId')
  @ApiOperation({ summary: 'Delete a relation between tasks' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'relationId', description: 'Relation ID' })
  async deleteRelation(
    @Param('id') taskId: string,
    @Param('relationId') relationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.deleteRelation(taskId, relationId, userId);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Reorder or move task across columns/priorities' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async moveTask(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      status?: TaskStatus;
      customStatus?: string | null;
      priority?: TaskPriority;
      targetOrder?: number;
    },
  ) {
    return this.tasksService.moveTask(id, body, userId);
  }

  @Post(':id/activities')
  @ApiOperation({ summary: 'Log activity on task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async logActivity(
    @Param('id') taskId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { type: string; details?: string; fromValue?: string; toValue?: string },
  ) {
    return this.tasksService.logActivity(taskId, userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete / archive task to trash' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async deleteTask(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.deleteTask(id, userId);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore archived task from trash' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async restoreTask(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.restoreTask(id, userId);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async permanentDeleteTask(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.permanentDeleteTask(id, userId);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Post comment on task (supports threaded replies)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async addComment(
    @Param('id') taskId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.tasksService.addComment(taskId, userId, body.content, body.parentId);
  }

  @Post(':id/subscribe')
  @ApiOperation({ summary: 'Subscribe to task updates' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async subscribeToTask(
    @Param('id') taskId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.subscribeToTask(taskId, userId);
  }

  @Delete(':id/subscribe')
  @ApiOperation({ summary: 'Unsubscribe from task updates' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async unsubscribeFromTask(
    @Param('id') taskId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.unsubscribeFromTask(taskId, userId);
  }

  @Get(':id/subscribers')
  @ApiOperation({ summary: 'Get subscribers of a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async getTaskSubscribers(@Param('id') taskId: string) {
    return this.tasksService.getTaskSubscribers(taskId);
  }

  @Patch(':id/comments/:commentId')
  @ApiOperation({ summary: 'Update comment on task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  async updateComment(
    @Param('id') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string },
  ) {
    return this.tasksService.updateComment(commentId, userId, body.content);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete comment on task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.deleteComment(commentId, userId);
  }

  @Post(':id/reactions')
  @ApiOperation({ summary: 'Toggle reaction on a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async toggleTaskReaction(
    @Param('id') taskId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { emoji: string },
  ) {
    return this.tasksService.toggleTaskReaction(taskId, userId, body.emoji);
  }

  @Post(':id/comments/:commentId/reactions')
  @ApiOperation({ summary: 'Toggle reaction on a task comment' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  async toggleCommentReaction(
    @Param('id') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { emoji: string },
  ) {
    return this.tasksService.toggleCommentReaction(taskId, commentId, userId, body.emoji);
  }
}
