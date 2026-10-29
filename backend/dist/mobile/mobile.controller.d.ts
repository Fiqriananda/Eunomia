import { MobileService } from './mobile.service.js';
import { MobileHomeQueryDto, MobileHomeResponseDto } from './dto/mobile-home.dto.js';
import { MobileTasksQueryDto, MobilePaginatedTasksResponseDto, MobileCreateTaskDto, MobileUpdateTaskDto, MobileUpdateTaskStatusDto, MobileUpdateTaskPriorityDto, MobileUpdateAssigneeDto, MobileAssignCycleDto, MobileCreateSubtaskDto, MobileCreateRelationDto, MobileTaskRelationDto, MobileAddCommentDto, MobileUpdateCommentDto, MobileCommentDto, MobileToggleReactionDto, MobileTaskActivityDto } from './dto/mobile-tasks.dto.js';
import { MobileTaskDetailDto } from './dto/mobile-task-detail.dto.js';
import { MobileNotificationsResponseDto } from './dto/mobile-notifications.dto.js';
import { MobileConfigResponseDto } from './dto/mobile-config.dto.js';
import { MobileWorkspaceListResponseDto, MobileWorkspaceMemberDto, MobileCreateWorkspaceDto, MobileInviteMemberDto } from './dto/mobile-workspaces.dto.js';
import { MobileProjectDto, MobileCreateProjectDto, MobileUpdateProjectDto, MobileProjectDetailDto } from './dto/mobile-projects.dto.js';
import { MobileCycleDto, MobileCreateCycleDto, MobileUpdateCycleDto, MobileCycleDetailDto } from './dto/mobile-cycles.dto.js';
import { MobileTrashListResponseDto } from './dto/mobile-trash.dto.js';
import { MobileSearchQueryDto, MobileSearchResultDto } from './dto/mobile-search.dto.js';
import { MobileProfileResponseDto, MobileUpdateProfileDto, MobileChangePasswordDto, MobileUserHoverCardDto } from './dto/mobile-profile.dto.js';
import { MobileAdminPerformanceResponseDto } from './dto/mobile-performance.dto.js';
import { RegisterDeviceTokenDto, UnregisterDeviceTokenDto, SendTestNotificationDto } from '../notifications/dto/device-token.dto.js';
export declare class MobileController {
    private readonly mobileService;
    constructor(mobileService: MobileService);
    getConfig(): MobileConfigResponseDto;
    getHome(userId: string, query: MobileHomeQueryDto): Promise<MobileHomeResponseDto>;
    getWorkspaces(userId: string): Promise<MobileWorkspaceListResponseDto>;
    createWorkspace(userId: string, dto: MobileCreateWorkspaceDto): Promise<{
        projects: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            key: string;
            color: string | null;
            workspaceId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
    }>;
    getWorkspaceMembers(workspaceId: string, userId: string): Promise<MobileWorkspaceMemberDto[]>;
    inviteWorkspaceMember(workspaceId: string, userId: string, dto: MobileInviteMemberDto): Promise<{
        message: string;
        invitation: {
            workspace: {
                id: string;
                name: string;
                slug: string;
            };
            invitedBy: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            token: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
            status: import("@prisma/client").$Enums.InvitationStatus;
            invitedById: string;
        };
    }>;
    getProjects(userId: string, workspaceId?: string): Promise<MobileProjectDto[]>;
    createProject(userId: string, dto: MobileCreateProjectDto): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        workspaceId: string;
    }>;
    getProjectDetail(userId: string, projectId: string): Promise<MobileProjectDetailDto>;
    updateProject(projectId: string, dto: MobileUpdateProjectDto): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        workspaceId: string;
    }>;
    deleteProject(projectId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        workspaceId: string;
    }>;
    getCycles(userId: string, workspaceId?: string): Promise<MobileCycleDto[]>;
    getCurrentCycle(userId: string, workspaceId?: string): Promise<MobileCycleDetailDto | null>;
    createCycle(userId: string, dto: MobileCreateCycleDto): Promise<{
        number: number;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        workspaceId: string;
        status: string;
        startDate: Date;
        endDate: Date;
    }>;
    updateCycle(cycleId: string, dto: MobileUpdateCycleDto): Promise<{
        number: number;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        workspaceId: string;
        status: string;
        startDate: Date;
        endDate: Date;
    }>;
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
    updateTask(userId: string, taskId: string, dto: MobileUpdateTaskDto): Promise<({
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
    updateStatus(userId: string, taskId: string, body: MobileUpdateTaskStatusDto): Promise<({
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
    updatePriority(userId: string, taskId: string, body: MobileUpdateTaskPriorityDto): Promise<({
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
    updateAssignee(userId: string, taskId: string, body: MobileUpdateAssigneeDto): Promise<({
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
    assignCycle(userId: string, taskId: string, body: MobileAssignCycleDto): Promise<({
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
    deleteTask(userId: string, taskId: string): Promise<{
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
    getSubtasks(taskId: string): Promise<({
        assignee: {
            id: string;
            name: string;
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
    })[]>;
    createSubtask(userId: string, parentTaskId: string, dto: MobileCreateSubtaskDto): Promise<{
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
    getTaskRelations(taskId: string): Promise<MobileTaskRelationDto[]>;
    createTaskRelation(userId: string, taskId: string, dto: MobileCreateRelationDto): Promise<{
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
    deleteTaskRelation(userId: string, taskId: string, relationId: string): Promise<{
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
    getTaskComments(taskId: string): Promise<MobileCommentDto[]>;
    addComment(userId: string, taskId: string, body: MobileAddCommentDto): Promise<{
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
    updateComment(userId: string, commentId: string, body: MobileUpdateCommentDto): Promise<{
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
    deleteComment(userId: string, commentId: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        taskId: string;
        content: string;
        parentId: string | null;
    }>;
    toggleTaskReaction(userId: string, taskId: string, body: MobileToggleReactionDto): Promise<{
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
    toggleCommentReaction(userId: string, taskId: string, commentId: string, body: MobileToggleReactionDto): Promise<{
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
    getTaskActivity(taskId: string): Promise<MobileTaskActivityDto[]>;
    getNotifications(userId: string, unreadOnly?: string): Promise<MobileNotificationsResponseDto>;
    markNotificationRead(userId: string, id: string): Promise<{
        task: {
            title: string;
            id: string;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
        } | null;
        actor: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        type: string;
        title: string;
        body: string | null;
        id: string;
        userId: string;
        createdAt: Date;
        taskId: string | null;
        workspaceId: string | null;
        isRead: boolean;
        readAt: Date | null;
        actorId: string;
        invitationId: string | null;
    }>;
    markAllNotificationsRead(userId: string): Promise<{
        success: boolean;
    }>;
    registerDeviceToken(userId: string, body: RegisterDeviceTokenDto): Promise<{
        token: string;
        platform: string | null;
        deviceModel: string | null;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    registerNotificationToken(userId: string, body: RegisterDeviceTokenDto): Promise<{
        token: string;
        platform: string | null;
        deviceModel: string | null;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    unregisterDeviceToken(userId: string, body: UnregisterDeviceTokenDto): Promise<{
        success: boolean;
    }>;
    unregisterNotificationToken(userId: string, body: UnregisterDeviceTokenDto): Promise<{
        success: boolean;
    }>;
    getNotificationStatus(userId: string): Promise<{
        serviceReady: boolean;
        registeredDevicesCount: number;
        deviceTokens: string[];
    }>;
    testPushNotification(userId: string, body: SendTestNotificationDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getTrash(userId: string, workspaceId?: string): Promise<MobileTrashListResponseDto>;
    restoreTask(userId: string, taskId: string): Promise<{
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
    permanentDeleteTask(userId: string, taskId: string): Promise<{
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
    search(userId: string, query: MobileSearchQueryDto): Promise<MobileSearchResultDto>;
    getProfile(userId: string): Promise<MobileProfileResponseDto>;
    updateProfile(userId: string, dto: MobileUpdateProfileDto): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
    }>;
    changePassword(userId: string, dto: MobileChangePasswordDto): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
    }>;
    getUserHoverCard(currentUserId: string, targetUserId: string, workspaceId?: string): Promise<MobileUserHoverCardDto>;
    getAdminPerformance(userId: string, workspaceId?: string, period?: string): Promise<MobileAdminPerformanceResponseDto>;
}
