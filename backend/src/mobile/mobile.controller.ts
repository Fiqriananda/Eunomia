import {
  Controller,
  Get,
  Post,
  Patch,
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
import {
  MobileHomeQueryDto,
  MobileHomeResponseDto,
} from './dto/mobile-home.dto.js';
import {
  MobileTasksQueryDto,
  MobilePaginatedTasksResponseDto,
  MobileCreateTaskDto,
  MobileUpdateTaskStatusDto,
  MobileUpdateTaskPriorityDto,
  MobileAddCommentDto,
} from './dto/mobile-tasks.dto.js';
import { MobileTaskDetailDto } from './dto/mobile-task-detail.dto.js';
import { MobileNotificationsResponseDto } from './dto/mobile-notifications.dto.js';
import { MobileConfigResponseDto } from './dto/mobile-config.dto.js';

@ApiTags('Mobile')
@Controller('mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('config')
  @ApiOperation({
    summary: 'Get mobile app configuration and metadata',
    description:
      'Returns metadata for client initialization including supported task statuses, priority levels with hex colors, and enabled features.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mobile initialization configuration',
    type: MobileConfigResponseDto,
  })
  getConfig(): MobileConfigResponseDto {
    return this.mobileService.getConfig();
  }

  @Get('home')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Consolidated Mobile Home Feed & Dashboard',
    description:
      'Single consolidated endpoint for mobile home screen. Returns user profile, active workspace, aggregate counters, urgent/assigned tasks, and project list in one fast network request.',
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
}
