import { TaskStatus, TaskPriority } from '@prisma/client';
import { MobileCompactTaskDto } from './mobile-home.dto.js';
export declare enum MobileTaskFilter {
    ASSIGNED_TO_ME = "assigned_to_me",
    CREATED_BY_ME = "created_by_me",
    ALL = "all"
}
export declare class MobileTasksQueryDto {
    workspaceId?: string;
    projectId?: string;
    filter?: MobileTaskFilter;
    status?: TaskStatus;
    priority?: TaskPriority;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class MobilePaginatedTasksResponseDto {
    items: MobileCompactTaskDto[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
}
export declare class MobileCreateTaskDto {
    title: string;
    description?: string;
    workspaceId?: string;
    projectId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
    labels?: string[];
    parentId?: string;
}
export declare class MobileUpdateTaskStatusDto {
    status: TaskStatus;
    customStatus?: string;
}
export declare class MobileUpdateTaskPriorityDto {
    priority: TaskPriority;
}
export declare class MobileAddCommentDto {
    content: string;
}
export declare class MobileUpdateCommentDto {
    content: string;
}
export declare class MobileCommentReactionDto {
    emoji: string;
    userId: string;
    userName: string;
}
export declare class MobileCommentDto {
    id: string;
    content: string;
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string | null;
    };
    reactions: MobileCommentReactionDto[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class MobileUpdateTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    projectId?: string | null;
    cycleId?: string | null;
    dueDate?: string | null;
    estimate?: number | null;
    labels?: string[];
}
export declare class MobileUpdateAssigneeDto {
    assigneeId?: string | null;
}
export declare class MobileAssignCycleDto {
    cycleId?: string | null;
}
export declare class MobileCreateSubtaskDto {
    title: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    assigneeId?: string;
}
export declare class MobileCreateRelationDto {
    targetTaskId: string;
    type: string;
}
export declare class MobileTaskRelationDto {
    id: string;
    type: string;
    targetTaskId: string;
    targetIdentifier: string;
    targetTitle: string;
    targetStatus: TaskStatus;
}
export declare class MobileToggleReactionDto {
    emoji: string;
}
export declare class MobileTaskActivityDto {
    id: string;
    type: string;
    description: string;
    actorName: string;
    actorAvatarUrl?: string | null;
    createdAt: Date;
}
