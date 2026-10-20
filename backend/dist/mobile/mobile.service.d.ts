import { PrismaService } from '../prisma/prisma.service.js';
import { TasksService } from '../tasks/tasks.service.js';
import { InboxService } from '../inbox/inbox.service.js';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { MobileHomeQueryDto, MobileHomeResponseDto } from './dto/mobile-home.dto.js';
import { MobileTasksQueryDto, MobilePaginatedTasksResponseDto, MobileCreateTaskDto } from './dto/mobile-tasks.dto.js';
import { MobileTaskDetailDto } from './dto/mobile-task-detail.dto.js';
import { MobileNotificationsResponseDto } from './dto/mobile-notifications.dto.js';
import { MobileConfigResponseDto } from './dto/mobile-config.dto.js';
export declare class MobileService {
    private readonly prisma;
    private readonly tasksService;
    private readonly inboxService;
    constructor(prisma: PrismaService, tasksService: TasksService, inboxService: InboxService);
    private mapToCompactTask;
    getHome(userId: string, query: MobileHomeQueryDto): Promise<MobileHomeResponseDto>;
    getTasks(userId: string, query: MobileTasksQueryDto): Promise<MobilePaginatedTasksResponseDto>;
    getTaskDetail(userId: string, taskId: string): Promise<MobileTaskDetailDto>;
    createTask(userId: string, dto: MobileCreateTaskDto): Promise<{
        project: {
            id: string;
            name: string;
            key: string;
            color: string | null;
        };
        cycle: {
            number: number;
            id: string;
            name: string | null;
            status: string;
        } | null;
        comments: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            content: string;
            taskId: string;
        })[];
        activities: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        } | null;
        parent: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
            identifier: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
        } | null;
        subTasks: ({
            project: {
                id: string;
                name: string;
                key: string;
                color: string | null;
            };
            assignee: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            workspaceId: string;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            identifier: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            assigneeId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                id: string;
                title: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                identifier: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                labels: string[];
                assignee: {
                    id: string;
                    email: string;
                    name: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            type: string;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                id: string;
                title: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                identifier: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                labels: string[];
                assignee: {
                    id: string;
                    email: string;
                    name: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            type: string;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            url: string;
            taskId: string | null;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        workspaceId: string;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        identifier: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        assigneeId: string | null;
        parentId: string | null;
    }>;
    updateTaskStatus(userId: string, taskId: string, status: TaskStatus, customStatus?: string): Promise<({
        project: {
            id: string;
            name: string;
            key: string;
            color: string | null;
        };
        cycle: {
            number: number;
            id: string;
            name: string | null;
            status: string;
        } | null;
        comments: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            content: string;
            taskId: string;
        })[];
        activities: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        } | null;
        parent: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
            identifier: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
        } | null;
        subTasks: ({
            project: {
                id: string;
                name: string;
                key: string;
                color: string | null;
            };
            assignee: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            workspaceId: string;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            identifier: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            assigneeId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                id: string;
                title: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                identifier: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                labels: string[];
                assignee: {
                    id: string;
                    email: string;
                    name: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            type: string;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                id: string;
                title: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                identifier: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                labels: string[];
                assignee: {
                    id: string;
                    email: string;
                    name: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            type: string;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            url: string;
            taskId: string | null;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        workspaceId: string;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        identifier: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        assigneeId: string | null;
        parentId: string | null;
    }) | null>;
    updateTaskPriority(userId: string, taskId: string, priority: TaskPriority): Promise<({
        project: {
            id: string;
            name: string;
            key: string;
            color: string | null;
        };
        cycle: {
            number: number;
            id: string;
            name: string | null;
            status: string;
        } | null;
        comments: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            content: string;
            taskId: string;
        })[];
        activities: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        } | null;
        parent: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
            identifier: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
        } | null;
        subTasks: ({
            project: {
                id: string;
                name: string;
                key: string;
                color: string | null;
            };
            assignee: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            workspaceId: string;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            identifier: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            assigneeId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                id: string;
                title: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                identifier: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                labels: string[];
                assignee: {
                    id: string;
                    email: string;
                    name: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            type: string;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                id: string;
                title: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                identifier: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                labels: string[];
                assignee: {
                    id: string;
                    email: string;
                    name: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            type: string;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            url: string;
            taskId: string | null;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        workspaceId: string;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        identifier: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        assigneeId: string | null;
        parentId: string | null;
    }) | null>;
    addComment(userId: string, taskId: string, content: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        content: string;
        taskId: string;
    }>;
    getNotifications(userId: string, unreadOnly?: boolean): Promise<MobileNotificationsResponseDto>;
    markNotificationRead(userId: string, notificationId: string): Promise<{
        task: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            identifier: string;
        } | null;
        actor: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        workspaceId: string | null;
        type: string;
        title: string;
        body: string | null;
        isRead: boolean;
        readAt: Date | null;
        actorId: string;
        taskId: string | null;
        invitationId: string | null;
    }>;
    markAllNotificationsRead(userId: string): Promise<{
        success: boolean;
    }>;
    getConfig(): MobileConfigResponseDto;
}
