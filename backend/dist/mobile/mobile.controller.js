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
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpStatus, HttpCode, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, } from '@nestjs/swagger';
import { MobileService } from './mobile.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { MobileHomeQueryDto, MobileHomeResponseDto, } from './dto/mobile-home.dto.js';
import { MobileTasksQueryDto, MobilePaginatedTasksResponseDto, MobileCreateTaskDto, MobileUpdateTaskStatusDto, MobileUpdateTaskPriorityDto, MobileAddCommentDto, } from './dto/mobile-tasks.dto.js';
import { MobileTaskDetailDto } from './dto/mobile-task-detail.dto.js';
import { MobileNotificationsResponseDto } from './dto/mobile-notifications.dto.js';
import { MobileConfigResponseDto } from './dto/mobile-config.dto.js';
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
    async getTasks(userId, query) {
        return this.mobileService.getTasks(userId, query);
    }
    async getTaskDetail(userId, taskId) {
        return this.mobileService.getTaskDetail(userId, taskId);
    }
    async createTask(userId, dto) {
        return this.mobileService.createTask(userId, dto);
    }
    async updateStatus(userId, taskId, body) {
        return this.mobileService.updateTaskStatus(userId, taskId, body.status, body.customStatus);
    }
    async updatePriority(userId, taskId, body) {
        return this.mobileService.updateTaskPriority(userId, taskId, body.priority);
    }
    async addComment(userId, taskId, body) {
        return this.mobileService.addComment(userId, taskId, body.content);
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
};
__decorate([
    Get('config'),
    ApiOperation({
        summary: 'Get mobile app configuration and metadata',
        description: 'Returns metadata for client initialization including supported task statuses, priority levels with hex colors, and enabled features.',
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
        description: 'Single consolidated endpoint for mobile home screen. Returns user profile, active workspace, aggregate counters, urgent/assigned tasks, and project list in one fast network request.',
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
MobileController = __decorate([
    ApiTags('Mobile'),
    Controller('mobile'),
    __metadata("design:paramtypes", [MobileService])
], MobileController);
export { MobileController };
//# sourceMappingURL=mobile.controller.js.map