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
