import { WorkspacesService } from './workspaces.service.js';
import { WorkspaceRole, TaskStatus } from '@prisma/client';
export declare class WorkspacesController {
    private readonly workspacesService;
    constructor(workspacesService: WorkspacesService);
    getUserWorkspaces(userId: string): Promise<{
        role: import("@prisma/client").$Enums.WorkspaceRole;
        members: ({
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
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
        })[];
        projects: {
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
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        logoUrl: string | null;
        ticketPrefix: string;
        columnOrder: string[];
        cyclesEnabled: boolean;
        whatsappEnabled: boolean;
        whatsappSessionName: string | null;
    }[]>;
    getInvitationByToken(token: string): Promise<{
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
        role: import("@prisma/client").$Enums.WorkspaceRole;
        workspaceId: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        email: string;
        invitedById: string;
    }>;
    acceptInvitation(token: string, userId: string): Promise<{
        success: boolean;
        message: string;
        workspace: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            logoUrl: string | null;
            ticketPrefix: string;
            columnOrder: string[];
            cyclesEnabled: boolean;
            whatsappEnabled: boolean;
            whatsappSessionName: string | null;
        };
        membership: {
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
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
        };
    }>;
    declineInvitation(token: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    acceptInvitationPublic(token: string, body: {
        name?: string;
        password?: string;
    }): Promise<{
        success: boolean;
        message: string;
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
        workspace: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            logoUrl: string | null;
            ticketPrefix: string;
            columnOrder: string[];
            cyclesEnabled: boolean;
            whatsappEnabled: boolean;
            whatsappSessionName: string | null;
        };
        membership: {
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
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
        };
    }>;
    getWorkspaceById(id: string, userId: string): Promise<{
        role: import("@prisma/client").$Enums.WorkspaceRole;
        members: ({
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
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
        })[];
        projects: {
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
        }[];
        divisions: ({
            members: ({
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
                role: string | null;
                divisionId: string;
            })[];
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            workspaceId: string;
            slug: string;
            isTechnical: boolean;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        logoUrl: string | null;
        ticketPrefix: string;
        columnOrder: string[];
        cyclesEnabled: boolean;
        whatsappEnabled: boolean;
        whatsappSessionName: string | null;
    }>;
    updateWorkspace(id: string, userId: string, body: {
        name?: string;
        cyclesEnabled?: boolean;
        logoUrl?: string | null;
        ticketPrefix?: string;
        migrateExistingTasks?: boolean;
    }): Promise<{
        role: "OWNER" | "ADMIN";
        members: ({
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
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
        })[];
        projects: {
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
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        logoUrl: string | null;
        ticketPrefix: string;
        columnOrder: string[];
        cyclesEnabled: boolean;
        whatsappEnabled: boolean;
        whatsappSessionName: string | null;
    }>;
    createWorkspace(userId: string, body: {
        name: string;
    }): Promise<{
        projects: {
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
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        logoUrl: string | null;
        ticketPrefix: string;
        columnOrder: string[];
        cyclesEnabled: boolean;
        whatsappEnabled: boolean;
        whatsappSessionName: string | null;
    }>;
    getWorkspaceMembers(id: string): Promise<({
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
        role: import("@prisma/client").$Enums.WorkspaceRole;
        workspaceId: string;
    })[]>;
    inviteMember(id: string, userId: string, body: {
        email: string;
        name?: string;
        role?: WorkspaceRole;
    }): Promise<{
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
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
            status: import("@prisma/client").$Enums.InvitationStatus;
            email: string;
            invitedById: string;
        };
    }>;
    getWorkspaceInvitations(workspaceId: string, userId: string): Promise<({
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
        role: import("@prisma/client").$Enums.WorkspaceRole;
        workspaceId: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        email: string;
        invitedById: string;
    })[]>;
    cancelInvitation(workspaceId: string, invitationId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateMemberRole(workspaceId: string, memberId: string, role: WorkspaceRole): Promise<{
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
        role: import("@prisma/client").$Enums.WorkspaceRole;
        workspaceId: string;
    }>;
    removeMember(workspaceId: string, memberId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getWorkspaceSections(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        color: string;
        progress: string | null;
        order: number;
        category: import("@prisma/client").$Enums.TaskStatus;
    }[]>;
    createWorkspaceSection(id: string, body: {
        name: string;
        key?: string;
        color?: string;
        progress?: string;
        category?: TaskStatus;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        color: string;
        progress: string | null;
        order: number;
        category: import("@prisma/client").$Enums.TaskStatus;
    }>;
    updateWorkspaceSection(id: string, sectionId: string, body: {
        name?: string;
        color?: string;
        progress?: string;
        category?: TaskStatus;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        color: string;
        progress: string | null;
        order: number;
        category: import("@prisma/client").$Enums.TaskStatus;
    }>;
    deleteWorkspaceSection(id: string, sectionId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        color: string;
        progress: string | null;
        order: number;
        category: import("@prisma/client").$Enums.TaskStatus;
    }>;
    updateColumnOrder(id: string, body: {
        columnOrder: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        logoUrl: string | null;
        ticketPrefix: string;
        columnOrder: string[];
        cyclesEnabled: boolean;
        whatsappEnabled: boolean;
        whatsappSessionName: string | null;
    }>;
    getDivisions(workspaceId: string): Promise<({
        members: ({
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
            role: string | null;
            divisionId: string;
        })[];
        _count: {
            assignedTasks: number;
            requestedTasks: number;
        };
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        workspaceId: string;
        slug: string;
        isTechnical: boolean;
    })[]>;
    createDivision(workspaceId: string, userId: string, body: {
        name: string;
        slug?: string;
        description?: string;
        isTechnical?: boolean;
    }): Promise<{
        members: ({
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
            role: string | null;
            divisionId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        workspaceId: string;
        slug: string;
        isTechnical: boolean;
    }>;
    updateDivision(divisionId: string, userId: string, body: {
        name?: string;
        slug?: string;
        description?: string;
        isTechnical?: boolean;
    }): Promise<{
        members: ({
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
            role: string | null;
            divisionId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        workspaceId: string;
        slug: string;
        isTechnical: boolean;
    }>;
    deleteDivision(divisionId: string, userId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        workspaceId: string;
        slug: string;
        isTechnical: boolean;
    }>;
    addDivisionMember(divisionId: string, userId: string, body: {
        userId: string;
        role?: string;
    }): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
        division: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            workspaceId: string;
            slug: string;
            isTechnical: boolean;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        role: string | null;
        divisionId: string;
    }>;
    removeDivisionMember(divisionId: string, targetUserId: string, userId: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        role: string | null;
        divisionId: string;
    }>;
}
