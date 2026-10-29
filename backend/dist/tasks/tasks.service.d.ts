import { PrismaService } from '../prisma/prisma.service.js';
import { TaskStatus, TaskPriority, TriageStatus } from '@prisma/client';
import { EmailService } from '../email/email.service.js';
import { EventsGateway } from '../events/events.gateway.js';
import { NotificationsService } from '../notifications/notifications.service.js';
export declare class TasksService {
    private prisma;
    private emailService;
    private eventsGateway;
    private notificationsService;
    constructor(prisma: PrismaService, emailService: EmailService, eventsGateway: EventsGateway, notificationsService: NotificationsService);
    private formatStatusName;
    notifySubscribersOfTaskUpdate(taskId: string, actorId: string | undefined, changes: Array<{
        field: string;
        from?: string;
        to?: string;
    }>, summaryTitle: string, excludeUserIds?: string[]): Promise<void>;
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
        requesterDivisionId?: string;
        assignedDivisionId?: string;
        triageStatus?: TriageStatus | 'ALL';
        includePendingTriage?: string;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
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
        requesterDivisionId?: string | null;
        assignedDivisionId?: string | null;
        triageStatus?: TriageStatus;
        externalMetadata?: any;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
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
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        type: string;
        id: string;
        userId: string;
        createdAt: Date;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
        parentId: string | null;
    }>;
    permanentDeleteTask(id: string, userId?: string): Promise<{
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
        parentId: string | null;
    }>;
    addComment(taskId: string, userId: string, content: string, parentId?: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        parent: {
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            id: string;
            content: string;
        } | null;
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        taskId: string;
        content: string;
        parentId: string | null;
    }>;
    updateComment(commentId: string, userId: string, content: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        taskId: string;
        content: string;
        parentId: string | null;
    }>;
    deleteComment(commentId: string, userId: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        taskId: string;
        content: string;
        parentId: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
        parentId: string | null;
    }>;
    toggleTaskReaction(taskId: string, userId: string, emoji: string): Promise<{
        action: string;
        emoji: string;
        taskId: string;
        userId: string;
        reaction?: undefined;
    } | {
        action: string;
        reaction: {
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        };
        taskId: string;
        userId: string;
        emoji?: undefined;
    }>;
    toggleCommentReaction(taskId: string, commentId: string, userId: string, emoji: string): Promise<{
        action: string;
        emoji: string;
        commentId: string;
        taskId: string;
        userId: string;
        reaction?: undefined;
    } | {
        action: string;
        reaction: {
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            emoji: string;
            commentId: string;
        };
        commentId: string;
        taskId: string;
        userId: string;
        emoji?: undefined;
    }>;
    subscribeToTask(taskId: string, userId: string): Promise<{
        success: boolean;
        subscription: {
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        };
    }>;
    unsubscribeFromTask(taskId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getTaskSubscribers(taskId: string): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        taskId: string;
    })[]>;
    createIntakeRequest(userId: string, data: {
        workspaceId: string;
        title: string;
        requesterDivisionId?: string;
        customDivisionName?: string;
        description: string;
        urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
        targetDeadline?: string;
        assetLinks?: string;
        businessObjective?: string;
        targetAudience?: string;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
        parentId: string | null;
    }>;
    getTriageRequests(workspaceId: string, userId: string): Promise<({
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
        parentId: string | null;
    })[]>;
    updateTriageStatus(taskId: string, userId: string, action: 'APPROVE' | 'REJECT' | 'RESUBMIT', options?: {
        priority?: TaskPriority;
        estimate?: number;
        cycleId?: string | null;
        status?: TaskStatus;
        comment?: string;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            parent: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                id: string;
                content: string;
            } | null;
            reactions: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                emoji: string;
                commentId: string;
            })[];
            replies: ({
                user: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                };
                reactions: ({
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    emoji: string;
                    commentId: string;
                })[];
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                taskId: string;
                content: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            taskId: string;
            content: string;
            parentId: string | null;
        })[];
        activities: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            type: string;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            fromValue: string | null;
            toValue: string | null;
            details: string | null;
        })[];
        creator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        requesterDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        assignedDivision: {
            id: string;
            name: string;
            slug: string;
            isTechnical: boolean;
        } | null;
        parent: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            customStatus: string | null;
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
                name: string;
                email: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        sourceRelations: ({
            targetTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        targetRelations: ({
            sourceTask: {
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                customStatus: string | null;
                labels: string[];
                assignee: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            type: string;
            id: string;
            createdAt: Date;
            sourceTaskId: string;
            targetTaskId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            taskId: string | null;
            url: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            uploaderId: string;
        }[];
        reactions: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
            emoji: string;
        })[];
        subscribers: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import("@prisma/client").$Enums.TaskPriority;
        identifier: string;
        assigneeId: string | null;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        order: number;
        customStatus: string | null;
        dueDate: Date | null;
        labels: string[];
        estimate: number | null;
        isArchived: boolean;
        deletedAt: Date | null;
        triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
        externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        projectId: string;
        cycleId: string | null;
        creatorId: string;
        requesterDivisionId: string | null;
        assignedDivisionId: string | null;
        parentId: string | null;
    }>;
}
