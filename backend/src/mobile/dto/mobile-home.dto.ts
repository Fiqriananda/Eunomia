import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class MobileHomeQueryDto {
  @ApiPropertyOptional({
    description: 'Specific workspace ID. If omitted, uses the user’s default/first workspace.',
    example: 'd3b07384-d113-4f9e-9d8a-81a6c0c5bf1a',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}

export class MobileUserProfileDto {
  @ApiProperty({ example: 'usr_123' })
  id: string;

  @ApiProperty({ example: 'Alex Vance' })
  name: string;

  @ApiProperty({ example: 'alex@company.com' })
  email: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  avatarUrl?: string | null;
}

export class MobileWorkspaceSummaryDto {
  @ApiProperty({ example: 'ws_123' })
  id: string;

  @ApiProperty({ example: 'Linear Corp' })
  name: string;

  @ApiProperty({ example: 'linear-corp' })
  slug: string;

  @ApiPropertyOptional({ example: 'OWNER' })
  role?: string;
}

export class MobileHomeStatsDto {
  @ApiProperty({ description: 'Total tasks assigned to user', example: 5 })
  assignedCount: number;

  @ApiProperty({ description: 'Tasks currently in progress for user', example: 2 })
  inProgressCount: number;

  @ApiProperty({ description: 'Tasks due today or overdue', example: 1 })
  dueSoonCount: number;

  @ApiProperty({ description: 'High or Urgent tasks assigned to user', example: 3 })
  urgentCount: number;

  @ApiProperty({ description: 'Tasks completed by user this week', example: 8 })
  completedThisWeekCount: number;

  @ApiProperty({ description: 'Unread inbox notifications count', example: 4 })
  unreadNotificationsCount: number;
}

export class MobileCompactTaskDto {
  @ApiProperty({ example: 'task_123' })
  id: string;

  @ApiProperty({ example: 'LIN-14' })
  identifier: string;

  @ApiProperty({ example: 'Implement mobile biometric login' })
  title: string;

  @ApiPropertyOptional({ example: 'Add FaceID and Fingerprint support for iOS and Android' })
  description?: string | null;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  status: TaskStatus;

  @ApiPropertyOptional({ example: null })
  customStatus?: string | null;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  priority: TaskPriority;

  @ApiPropertyOptional({ example: '2026-10-25T12:00:00.000Z' })
  dueDate?: Date | null;

  @ApiProperty({ example: ['mobile', 'auth'] })
  labels: string[];

  @ApiPropertyOptional({
    example: { id: 'proj_1', name: 'Mobile App', key: 'LIN', color: '#6366f1' },
  })
  project?: {
    id: string;
    name: string;
    key: string;
    color: string | null;
  };

  @ApiPropertyOptional({
    example: { id: 'usr_1', name: 'Jane Doe', avatarUrl: null },
  })
  assignee?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;

  @ApiProperty({ example: 3 })
  subtasksCount: number;

  @ApiProperty({ example: 1 })
  subtasksCompletedCount: number;

  @ApiProperty({ example: 5 })
  commentsCount: number;

  @ApiProperty({ example: 2 })
  attachmentsCount: number;

  @ApiProperty({ example: '2026-10-18T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-19T08:30:00.000Z' })
  updatedAt: Date;
}

export class MobileProjectSummaryDto {
  @ApiProperty({ example: 'proj_1' })
  id: string;

  @ApiProperty({ example: 'Core Platform' })
  name: string;

  @ApiProperty({ example: 'COR' })
  key: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  color?: string | null;

  @ApiProperty({ example: 18 })
  taskCount: number;
}

export class MobileStatusCountDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  status: TaskStatus;

  @ApiProperty({ example: 'Todo' })
  label: string;

  @ApiProperty({ example: 12 })
  count: number;
}

export class MobileHomeResponseDto {
  @ApiProperty({ type: () => MobileUserProfileDto })
  user: MobileUserProfileDto;

  @ApiProperty({ type: () => MobileWorkspaceSummaryDto })
  currentWorkspace: MobileWorkspaceSummaryDto;

  @ApiProperty({ type: () => [MobileWorkspaceSummaryDto] })
  availableWorkspaces: MobileWorkspaceSummaryDto[];

  @ApiProperty({ type: () => MobileHomeStatsDto })
  stats: MobileHomeStatsDto;

  @ApiProperty({ type: () => [MobileCompactTaskDto], description: 'High priority & urgent tasks assigned to current user' })
  myAssignedTasks: MobileCompactTaskDto[];

  @ApiProperty({ type: () => [MobileProjectSummaryDto] })
  projects: MobileProjectSummaryDto[];

  @ApiProperty({ type: () => [MobileStatusCountDto] })
  statusBreakdown: MobileStatusCountDto[];
}
