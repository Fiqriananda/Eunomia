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
