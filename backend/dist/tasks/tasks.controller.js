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
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, } from '@nestjs/swagger';
import { TasksService } from './tasks.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { TaskStatus, TaskPriority } from '@prisma/client';
let TasksController = class TasksController {
    tasksService;
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    async getTasks(workspaceId, projectId, cycleId, status, priority, assigneeId, search, parentId, archived) {
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
        });
    }
    async getTaskById(id) {
        return this.tasksService.getTaskById(id);
    }
    async createTask(userId, body) {
        return this.tasksService.createTask(userId, body);
    }
    async updateTask(id, userId, body) {
        return this.tasksService.updateTask(id, body, userId);
    }
    async createSubTask(parentId, userId, body) {
        return this.tasksService.createSubTask(parentId, userId, body);
    }
    async linkSubTask(parentId, userId, body) {
        return this.tasksService.linkSubTask(parentId, body.subTaskId, userId);
    }
    async unlinkSubTask(parentId, subTaskId, userId) {
        return this.tasksService.unlinkSubTask(parentId, subTaskId, userId);
    }
    async addRelation(taskId, userId, body) {
        return this.tasksService.addRelation(taskId, userId, body);
    }
    async deleteRelation(taskId, relationId, userId) {
        return this.tasksService.deleteRelation(taskId, relationId, userId);
    }
    async moveTask(id, userId, body) {
        return this.tasksService.moveTask(id, body, userId);
    }
    async logActivity(taskId, userId, body) {
        return this.tasksService.logActivity(taskId, userId, body);
    }
    async deleteTask(id, userId) {
        return this.tasksService.deleteTask(id, userId);
    }
    async restoreTask(id, userId) {
        return this.tasksService.restoreTask(id, userId);
    }
    async permanentDeleteTask(id, userId) {
        return this.tasksService.permanentDeleteTask(id, userId);
    }
    async addComment(taskId, userId, body) {
        return this.tasksService.addComment(taskId, userId, body.content, body.parentId);
    }
    async subscribeToTask(taskId, userId) {
        return this.tasksService.subscribeToTask(taskId, userId);
    }
    async unsubscribeFromTask(taskId, userId) {
        return this.tasksService.unsubscribeFromTask(taskId, userId);
    }
    async getTaskSubscribers(taskId) {
        return this.tasksService.getTaskSubscribers(taskId);
    }
    async updateComment(taskId, commentId, userId, body) {
        return this.tasksService.updateComment(commentId, userId, body.content);
    }
    async deleteComment(commentId, userId) {
        return this.tasksService.deleteComment(commentId, userId);
    }
    async toggleTaskReaction(taskId, userId, body) {
        return this.tasksService.toggleTaskReaction(taskId, userId, body.emoji);
    }
    async toggleCommentReaction(taskId, commentId, userId, body) {
        return this.tasksService.toggleCommentReaction(taskId, commentId, userId, body.emoji);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get list of tasks with filters (including cycles and archived trash)' }),
    ApiQuery({ name: 'workspaceId', required: true, description: 'Workspace ID' }),
    ApiQuery({ name: 'projectId', required: false, description: 'Filter by project' }),
    ApiQuery({ name: 'cycleId', required: false, description: 'Filter by cycle/sprint' }),
    ApiQuery({ name: 'status', required: false, enum: TaskStatus, description: 'Filter by status' }),
    ApiQuery({ name: 'priority', required: false, enum: TaskPriority, description: 'Filter by priority' }),
    ApiQuery({ name: 'assigneeId', required: false, description: 'Filter by assignee' }),
    ApiQuery({ name: 'search', required: false, description: 'Text search' }),
    ApiQuery({ name: 'parentId', required: false, description: 'Parent task ID' }),
    ApiQuery({ name: 'archived', required: false, description: 'Set to "true" to view trash / archived tasks' }),
    __param(0, Query('workspaceId')),
    __param(1, Query('projectId')),
    __param(2, Query('cycleId')),
    __param(3, Query('status')),
    __param(4, Query('priority')),
    __param(5, Query('assigneeId')),
    __param(6, Query('search')),
    __param(7, Query('parentId')),
    __param(8, Query('archived')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getTasks", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get task by ID' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getTaskById", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new task' }),
    __param(0, CurrentUser('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "createTask", null);
__decorate([
    Patch(':id'),
    ApiOperation({ summary: 'Update task properties' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "updateTask", null);
__decorate([
    Post(':id/subtasks'),
    ApiOperation({ summary: 'Create a subtask for a parent task' }),
    ApiParam({ name: 'id', description: 'Parent task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "createSubTask", null);
__decorate([
    Post(':id/link-subtask'),
    ApiOperation({ summary: 'Link an existing task as subtask' }),
    ApiParam({ name: 'id', description: 'Parent task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "linkSubTask", null);
__decorate([
    Delete(':id/subtasks/:subTaskId'),
    ApiOperation({ summary: 'Unlink subtask from parent' }),
    ApiParam({ name: 'id', description: 'Parent task ID' }),
    ApiParam({ name: 'subTaskId', description: 'Subtask ID' }),
    __param(0, Param('id')),
    __param(1, Param('subTaskId')),
    __param(2, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "unlinkSubTask", null);
__decorate([
    Post(':id/relations'),
    ApiOperation({ summary: 'Add relation between tasks (Blocks, Related, Duplicate)' }),
    ApiParam({ name: 'id', description: 'Source task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "addRelation", null);
__decorate([
    Delete(':id/relations/:relationId'),
    ApiOperation({ summary: 'Delete a relation between tasks' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiParam({ name: 'relationId', description: 'Relation ID' }),
    __param(0, Param('id')),
    __param(1, Param('relationId')),
    __param(2, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "deleteRelation", null);
__decorate([
    Patch(':id/move'),
    ApiOperation({ summary: 'Reorder or move task across columns/priorities' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "moveTask", null);
__decorate([
    Post(':id/activities'),
    ApiOperation({ summary: 'Log activity on task' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "logActivity", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Soft delete / archive task to trash' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "deleteTask", null);
__decorate([
    Patch(':id/restore'),
    ApiOperation({ summary: 'Restore archived task from trash' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "restoreTask", null);
__decorate([
    Delete(':id/permanent'),
    ApiOperation({ summary: 'Permanently delete task' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "permanentDeleteTask", null);
__decorate([
    Post(':id/comments'),
    ApiOperation({ summary: 'Post comment on task (supports threaded replies)' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "addComment", null);
__decorate([
    Post(':id/subscribe'),
    ApiOperation({ summary: 'Subscribe to task updates' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "subscribeToTask", null);
__decorate([
    Delete(':id/subscribe'),
    ApiOperation({ summary: 'Unsubscribe from task updates' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "unsubscribeFromTask", null);
__decorate([
    Get(':id/subscribers'),
    ApiOperation({ summary: 'Get subscribers of a task' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getTaskSubscribers", null);
__decorate([
    Patch(':id/comments/:commentId'),
    ApiOperation({ summary: 'Update comment on task' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiParam({ name: 'commentId', description: 'Comment ID' }),
    __param(0, Param('id')),
    __param(1, Param('commentId')),
    __param(2, CurrentUser('id')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "updateComment", null);
__decorate([
    Delete(':id/comments/:commentId'),
    ApiOperation({ summary: 'Delete comment on task' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiParam({ name: 'commentId', description: 'Comment ID' }),
    __param(0, Param('commentId')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "deleteComment", null);
__decorate([
    Post(':id/reactions'),
    ApiOperation({ summary: 'Toggle reaction on a task' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "toggleTaskReaction", null);
__decorate([
    Post(':id/comments/:commentId/reactions'),
    ApiOperation({ summary: 'Toggle reaction on a task comment' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiParam({ name: 'commentId', description: 'Comment ID' }),
    __param(0, Param('id')),
    __param(1, Param('commentId')),
    __param(2, CurrentUser('id')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "toggleCommentReaction", null);
TasksController = __decorate([
    ApiTags('Tasks'),
    ApiBearerAuth('JWT-auth'),
    UseGuards(JwtAuthGuard),
    Controller('tasks'),
    __metadata("design:paramtypes", [TasksService])
], TasksController);
export { TasksController };
//# sourceMappingURL=tasks.controller.js.map