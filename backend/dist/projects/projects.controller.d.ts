import { ProjectsService } from './projects.service.js';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    getProjects(workspaceId: string): Promise<({
        tasks: {
            title: string;
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            assignee: {
                id: string;
                name: string;
                avatarUrl: string | null;
            } | null;
            dueDate: Date | null;
            estimate: number | null;
            isArchived: boolean;
        }[];
        _count: {
            tasks: number;
        };
        lead: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        status: string;
        color: string | null;
        targetDate: Date | null;
        leadId: string | null;
    })[]>;
    getProject(id: string): Promise<{
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
            projectId: string | null;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        _count: {
            tasks: number;
        };
        lead: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        status: string;
        color: string | null;
        targetDate: Date | null;
        leadId: string | null;
    }>;
    createProject(body: {
        workspaceId: string;
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
            projectId: string | null;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        }[];
        _count: {
            tasks: number;
        };
        lead: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        status: string;
        color: string | null;
        targetDate: Date | null;
        leadId: string | null;
    }>;
    updateProject(id: string, body: {
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
            projectId: string | null;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        }[];
        _count: {
            tasks: number;
        };
        lead: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        } | null;
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        status: string;
        color: string | null;
        targetDate: Date | null;
        leadId: string | null;
    }>;
    deleteProject(id: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        status: string;
        color: string | null;
        targetDate: Date | null;
        leadId: string | null;
    }>;
}
