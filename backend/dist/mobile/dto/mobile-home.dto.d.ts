import { TaskStatus, TaskPriority } from '@prisma/client';
export declare class MobileHomeQueryDto {
    workspaceId?: string;
}
export declare class MobileUserProfileDto {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
}
export declare class MobileWorkspaceSummaryDto {
    id: string;
    name: string;
    slug: string;
    role?: string;
}
export declare class MobileHomeStatsDto {
    assignedCount: number;
    inProgressCount: number;
    dueSoonCount: number;
    urgentCount: number;
    completedThisWeekCount: number;
    unreadNotificationsCount: number;
}
export declare class MobileCompactTaskDto {
    id: string;
    identifier: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    customStatus?: string | null;
    priority: TaskPriority;
    dueDate?: Date | null;
    labels: string[];
    project?: {
        id: string;
        name: string;
        key: string;
        color: string | null;
    };
    assignee?: {
        id: string;
        name: string;
        avatarUrl: string | null;
    } | null;
    subtasksCount: number;
    subtasksCompletedCount: number;
    commentsCount: number;
    attachmentsCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class MobileProjectSummaryDto {
    id: string;
    name: string;
    key: string;
    color?: string | null;
    taskCount: number;
}
export declare class MobileStatusCountDto {
    status: TaskStatus;
    label: string;
    count: number;
}
export declare class MobileHomeResponseDto {
    user: MobileUserProfileDto;
    currentWorkspace: MobileWorkspaceSummaryDto;
    availableWorkspaces: MobileWorkspaceSummaryDto[];
    stats: MobileHomeStatsDto;
    myAssignedTasks: MobileCompactTaskDto[];
    projects: MobileProjectSummaryDto[];
    statusBreakdown: MobileStatusCountDto[];
}
