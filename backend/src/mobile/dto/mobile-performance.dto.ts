import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';

export class MobileMemberPerformanceDto {
  @ApiProperty({ example: 'usr_123' })
  userId: string;

  @ApiProperty({ example: 'Sarah Connor' })
  name: string;

  @ApiProperty({ example: 'sarah@linear.app' })
  email: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' })
  avatarUrl?: string | null;

  @ApiProperty({ enum: WorkspaceRole, example: WorkspaceRole.MEMBER })
  role: WorkspaceRole;

  @ApiProperty({ example: 25, description: 'Total tasks assigned to member' })
  assignedTasks: number;

  @ApiProperty({ example: 21, description: 'Tasks marked as DONE' })
  completedTasks: number;

  @ApiProperty({ example: 3, description: 'Tasks currently in IN_PROGRESS status' })
  inProgressTasks: number;

  @ApiProperty({ example: 84, description: 'Completion percentage (0 - 100)' })
  completionRate: number;

  @ApiProperty({ example: 7, description: 'Tasks finished in the last 7 days' })
  completedThisWeek: number;

  @ApiProperty({ example: 18, description: 'Tasks finished in the last 30 days' })
  completedThisMonth: number;

  @ApiProperty({ example: 1, description: 'Leaderboard rank based on completed tasks' })
  rank: number;

  @ApiProperty({ example: 'EXCELLENT', enum: ['EXCELLENT', 'HIGH', 'ON_TRACK', 'NEEDS_FOCUS'] })
  performanceGrade: 'EXCELLENT' | 'HIGH' | 'ON_TRACK' | 'NEEDS_FOCUS';
}

export class MobileProjectPerformanceDto {
  @ApiProperty({ example: 'proj_123' })
  projectId: string;

  @ApiProperty({ example: 'Mobile Core' })
  name: string;

  @ApiProperty({ example: 'MOB' })
  key: string;

  @ApiPropertyOptional({ example: '#5e6ad2' })
  color?: string | null;

  @ApiProperty({ example: 40 })
  totalTasks: number;

  @ApiProperty({ example: 32 })
  completedTasks: number;

  @ApiProperty({ example: 80, description: 'Percentage completion (0 - 100)' })
  completionRate: number;
}

export class MobileCyclePerformanceDto {
  @ApiProperty({ example: 'cyc_123' })
  cycleId: string;

  @ApiProperty({ example: 'Cycle 14' })
  name: string;

  @ApiProperty({ example: 14 })
  number: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 20 })
  totalTasks: number;

  @ApiProperty({ example: 16 })
  completedTasks: number;

  @ApiProperty({ example: 80 })
  completionRate: number;
}

export class MobilePerformanceSummaryDto {
  @ApiProperty({ example: 120, description: 'Total tasks in workspace' })
  totalTasks: number;

  @ApiProperty({ example: 92, description: 'Total finished/completed tasks' })
  completedTasks: number;

  @ApiProperty({ example: 76.7, description: 'Overall completion rate percentage' })
  completionRate: number;

  @ApiProperty({ example: 18, description: 'Tasks currently in progress' })
  inProgressTasks: number;

  @ApiProperty({ example: 10, description: 'Tasks in backlog or todo' })
  pendingTasks: number;

  @ApiProperty({ example: 24, description: 'Tasks finished in the last 7 days' })
  completedThisWeek: number;

  @ApiProperty({ example: 68, description: 'Tasks finished in the last 30 days' })
  completedThisMonth: number;

  @ApiProperty({ example: 8, description: 'Total workspace members' })
  totalMembers: number;

  @ApiProperty({ example: 6, description: 'Members with active or completed tasks' })
  activeMembers: number;

  @ApiProperty({ example: 11.5, description: 'Average completed tasks per member' })
  avgTasksPerMember: number;
}

export class MobileRecentDoneTaskDto {
  @ApiProperty({ example: 'task_123' })
  id: string;

  @ApiProperty({ example: 'MOB-42' })
  identifier: string;

  @ApiProperty({ example: 'Implement biometric authentication' })
  title: string;

  @ApiProperty({ example: 'Mobile Core' })
  projectName: string;

  @ApiPropertyOptional({ example: 'Sarah Connor' })
  assigneeName?: string | null;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' })
  assigneeAvatarUrl?: string | null;

  @ApiProperty({ example: '2026-10-22T08:00:00.000Z' })
  completedAt: Date;
}

export class MobileAdminPerformanceResponseDto {
  @ApiProperty({ example: 'ws_123' })
  workspaceId: string;

  @ApiProperty({ example: 'Acme Product Team' })
  workspaceName: string;

  @ApiProperty({ enum: WorkspaceRole, example: WorkspaceRole.ADMIN })
  currentUserRole: WorkspaceRole;

  @ApiProperty({ example: 'all', enum: ['all', 'this_week', 'this_month'] })
  period: string;

  @ApiProperty({ type: () => MobilePerformanceSummaryDto })
  summary: MobilePerformanceSummaryDto;

  @ApiProperty({ type: () => [MobileMemberPerformanceDto] })
  members: MobileMemberPerformanceDto[];

  @ApiProperty({ type: () => [MobileProjectPerformanceDto] })
  projects: MobileProjectPerformanceDto[];

  @ApiProperty({ type: () => [MobileCyclePerformanceDto] })
  cycles: MobileCyclePerformanceDto[];

  @ApiProperty({ type: () => [MobileRecentDoneTaskDto] })
  recentDoneTasks: MobileRecentDoneTaskDto[];
}
