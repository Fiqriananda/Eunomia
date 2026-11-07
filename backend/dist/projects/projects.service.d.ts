import { PrismaService } from '../prisma/prisma.service.js';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    getProjectsByWorkspace(workspaceId: string): Promise<({
        tasks: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            dueDate: Date | null;
            estimate: number | null;
            isArchived: boolean;
            assignee: {
                id: string;
                name: string;
                avatarUrl: string | null;
            } | null;
        }[];
        lead: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        _count: {
            tasks: number;
        };
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        status: string;
        targetDate: Date | null;
        leadId: string | null;
        workspaceId: string;
    })[]>;
    getProjectById(id: string): Promise<{
        tasks: ({
            cycle: {
                number: number;
                id: string;
                name: string | null;
                status: string;
            } | null;
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
            status: import("@prisma/client").$Enums.TaskStatus;
            workspaceId: string;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string | null;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        lead: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        _count: {
            tasks: number;
        };
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        status: string;
        targetDate: Date | null;
        leadId: string | null;
        workspaceId: string;
    }>;
    createProject(workspaceId: string, data: {
        name: string;
        key?: string;
        description?: string;
        color?: string;
        status?: string;
        targetDate?: string;
        leadId?: string;
    }): Promise<{
        tasks: {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            workspaceId: string;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string | null;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        }[];
        lead: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        _count: {
            tasks: number;
        };
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        status: string;
        targetDate: Date | null;
        leadId: string | null;
        workspaceId: string;
    }>;
    updateProject(id: string, data: {
        name?: string;
        key?: string;
        description?: string;
        color?: string;
        status?: string;
        targetDate?: string | null;
        leadId?: string | null;
    }): Promise<{
        tasks: {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            workspaceId: string;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string | null;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        }[];
        lead: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
        _count: {
            tasks: number;
        };
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        status: string;
        targetDate: Date | null;
        leadId: string | null;
        workspaceId: string;
    }>;
    deleteProject(id: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        status: string;
        targetDate: Date | null;
        leadId: string | null;
        workspaceId: string;
    }>;
}
