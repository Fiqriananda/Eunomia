import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { MobileCompactTaskDto } from './mobile-home.dto.js';

export enum MobileTaskFilter {
  ASSIGNED_TO_ME = 'assigned_to_me',
  CREATED_BY_ME = 'created_by_me',
  ALL = 'all',
}

export class MobileTasksQueryDto {
  @ApiPropertyOptional({
    description: 'Workspace ID (defaults to user primary workspace)',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific Project ID',
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    enum: MobileTaskFilter,
    default: MobileTaskFilter.ASSIGNED_TO_ME,
    description: 'Filter scope: assigned_to_me, created_by_me, or all',
  })
  @IsOptional()
  @IsEnum(MobileTaskFilter)
  filter?: MobileTaskFilter;

  @ApiPropertyOptional({
    enum: TaskStatus,
    description: 'Filter by task status',
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: 'Filter by task priority',
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Search keyword matching title, description or identifier',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class MobilePaginatedTasksResponseDto {
  @ApiProperty({ type: () => [MobileCompactTaskDto] })
  items: MobileCompactTaskDto[];

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasMore: boolean;
}

export class MobileCreateTaskDto {
  @ApiProperty({
    description: 'Title of the task',
    example: 'Optimize mobile offline sync',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description (Markdown supported)',
    example: 'Store tasks locally in SQLite and reconcile on reconnect.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Workspace ID. Defaults to the user’s primary workspace if omitted.',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({
    description: 'Project ID. Defaults to the first project in workspace if omitted.',
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    default: TaskPriority.NO_PRIORITY,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Assignee user ID (defaults to unassigned or current user)',
  })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Due date in ISO format',
    example: '2026-11-01T12:00:00Z',
  })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Array of tag strings',
    example: ['mobile', 'v2'],
  })
  @IsOptional()
  @IsArray()
  labels?: string[];

  @ApiPropertyOptional({
    description: 'Parent task ID if creating as a subtask',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class MobileUpdateTaskStatusDto {
  @ApiProperty({
    enum: TaskStatus,
    description: 'Target status (BACKLOG, TODO, IN_PROGRESS, DONE, CANCELED)',
    example: TaskStatus.DONE,
  })
  @IsNotEmpty()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiPropertyOptional({
    description: 'Optional custom status column identifier',
  })
  @IsOptional()
  @IsString()
  customStatus?: string;
}

export class MobileUpdateTaskPriorityDto {
  @ApiProperty({
    enum: TaskPriority,
    description: 'Target priority (NO_PRIORITY, LOW, MEDIUM, HIGH, URGENT)',
    example: TaskPriority.HIGH,
  })
  @IsNotEmpty()
  @IsEnum(TaskPriority)
  priority: TaskPriority;
}

export class MobileAddCommentDto {
  @ApiProperty({
    description: 'Comment body text',
    example: 'Working on this now from mobile.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class MobileUpdateCommentDto {
  @ApiProperty({
    description: 'Updated comment content',
    example: 'Revised comment text from mobile app.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class MobileCommentReactionDto {
  @ApiProperty({ example: '❤️' })
  emoji: string;

  @ApiProperty({ example: 'usr_123' })
  userId: string;

  @ApiProperty({ example: 'Alex Vance' })
  userName: string;
}

export class MobileCommentDto {
  @ApiProperty({ example: 'comm_123' })
  id: string;

  @ApiProperty({ example: 'Great progress on this issue!' })
  content: string;

  @ApiProperty({ example: 'usr_123' })
  userId: string;

  @ApiProperty({
    example: {
      id: 'usr_123',
      name: 'Sarah Connor',
      email: 'sarah@linear.app',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    },
  })
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };

  @ApiProperty({ type: () => [MobileCommentReactionDto] })
  reactions: MobileCommentReactionDto[];

  @ApiProperty({ example: '2026-10-21T14:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-21T14:30:00.000Z' })
  updatedAt: Date;
}

export class MobileUpdateTaskDto {
  @ApiPropertyOptional({ example: 'Update authentication flow' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Detailed description supporting Markdown' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 'usr_123', description: 'Assignee User ID or null to unassign' })
  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @ApiPropertyOptional({ example: 'proj_123', description: 'Project ID or null' })
  @IsOptional()
  @IsString()
  projectId?: string | null;

  @ApiPropertyOptional({ example: 'cyc_123', description: 'Cycle/Sprint ID or null' })
  @IsOptional()
  @IsString()
  cycleId?: string | null;

  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.000Z' })
  @IsOptional()
  @IsString()
  dueDate?: string | null;

  @ApiPropertyOptional({ example: 3, description: 'Estimate story points' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  estimate?: number | null;

  @ApiPropertyOptional({ example: ['Frontend', 'Bug'] })
  @IsOptional()
  @IsArray()
  labels?: string[];
}

export class MobileUpdateAssigneeDto {
  @ApiPropertyOptional({ example: 'usr_123', description: 'User ID to assign, or null to unassign' })
  @IsOptional()
  @IsString()
  assigneeId?: string | null;
}

export class MobileAssignCycleDto {
  @ApiPropertyOptional({ example: 'cyc_123', description: 'Cycle ID or null to detach' })
  @IsOptional()
  @IsString()
  cycleId?: string | null;
}

export class MobileCreateSubtaskDto {
  @ApiProperty({ example: 'Implement biometric token storage' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus = TaskStatus.TODO;

  @ApiPropertyOptional({ example: 'usr_123' })
  @IsOptional()
  @IsString()
  assigneeId?: string;
}

export class MobileCreateRelationDto {
  @ApiProperty({ example: 'task_target_123', description: 'ID of target task to relate' })
  @IsNotEmpty()
  @IsString()
  targetTaskId: string;

  @ApiProperty({
    example: 'BLOCKS',
    enum: ['BLOCKS', 'BLOCKED_BY', 'RELATES_TO', 'DUPLICATE'],
    description: 'Relationship type',
  })
  @IsNotEmpty()
  @IsString()
  type: string;
}

export class MobileTaskRelationDto {
  @ApiProperty({ example: 'rel_123' })
  id: string;

  @ApiProperty({ example: 'BLOCKS' })
  type: string;

  @ApiProperty({ example: 'task_target_123' })
  targetTaskId: string;

  @ApiProperty({ example: 'TJAR-9' })
  targetIdentifier: string;

  @ApiProperty({ example: 'Implement auth refresh token backend' })
  targetTitle: string;

  @ApiProperty({ example: 'DONE', enum: TaskStatus })
  targetStatus: TaskStatus;
}

export class MobileToggleReactionDto {
  @ApiProperty({ example: '👍', description: 'Emoji to toggle (e.g. 👍, ❤️, 🔥, 🎉, 👀, 🚀)' })
  @IsNotEmpty()
  @IsString()
  emoji: string;
}

export class MobileTaskActivityDto {
  @ApiProperty({ example: 'act_123' })
  id: string;

  @ApiProperty({ example: 'STATUS_CHANGED' })
  type: string;

  @ApiProperty({ example: 'changed status from Todo to In Progress' })
  description: string;

  @ApiProperty({ example: 'Alex Vance' })
  actorName: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  actorAvatarUrl?: string | null;

  @ApiProperty({ example: '2026-10-21T15:20:00.000Z' })
  createdAt: Date;
}

