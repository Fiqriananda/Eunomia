import { PrismaService } from '../prisma/prisma.service.js';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { EmailService } from '../email/email.service.js';
import { EventsGateway } from '../events/events.gateway.js';
export declare class TasksService {
    private prisma;
    private emailService;
    private eventsGateway;
    constructor(prisma: PrismaService, emailService: EmailService, eventsGateway: EventsGateway);
    private formatStatusName;
    getTasks(params: {
        workspaceId: string;
        projectId?: string;
        cycleId?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        assigneeId?: string;
        search?: string;
        parentId?: string;
        archived?: string;
    }): Promise<({
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
    })[]>;
    getTaskById(id: string): Promise<{
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
    createTask(userId: string, data: {
        workspaceId: string;
        projectId: string;
        title: string;
        description?: string;
        status?: TaskStatus;
        customStatus?: string | null;
        priority?: TaskPriority;
        assigneeId?: string;
        dueDate?: string;
        labels?: string[];
        parentId?: string | null;
        cycleId?: string | null;
        estimate?: number;
    }): Promise<{
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
    updateTask(id: string, data: {
        title?: string;
        description?: string;
        status?: TaskStatus;
        customStatus?: string | null;
        priority?: TaskPriority;
        assigneeId?: string | null;
        dueDate?: string | null;
        labels?: string[];
        projectId?: string;
        identifier?: string;
        parentId?: string | null;
        cycleId?: string | null;
        estimate?: number;
        isArchived?: boolean;
    }, userId?: string): Promise<({
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
    moveTask(id: string, data: {
        status?: TaskStatus;
        customStatus?: string | null;
        priority?: TaskPriority;
        targetOrder?: number;
    }, userId?: string): Promise<({
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
    logActivity(taskId: string, userId: string, data: {
        type: string;
        details?: string;
        fromValue?: string;
        toValue?: string;
    }): Promise<{
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
    }>;
    deleteTask(id: string, userId?: string): Promise<{
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
    restoreTask(id: string, userId?: string): Promise<{
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
    permanentDeleteTask(id: string, userId?: string): Promise<{
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
    addComment(taskId: string, userId: string, content: string): Promise<{
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
    deleteComment(commentId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        content: string;
        taskId: string;
    }>;
    createSubTask(parentId: string, userId: string, data: {
        title: string;
        description?: string;
        status?: TaskStatus;
        customStatus?: string | null;
        priority?: TaskPriority;
        assigneeId?: string;
        dueDate?: string;
        labels?: string[];
        projectId?: string;
    }): Promise<{
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
    linkSubTask(parentId: string, subTaskId: string, userId: string): Promise<{
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
    unlinkSubTask(parentId: string, subTaskId: string, userId: string): Promise<{
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
    addRelation(taskId: string, userId: string, data: {
        targetTaskId: string;
        type?: string;
    }): Promise<{
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
    deleteRelation(taskId: string, relationId: string, userId: string): Promise<{
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
}
