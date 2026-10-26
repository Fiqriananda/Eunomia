import { WorkspacesService } from './workspaces.service.js';
import { WorkspaceRole, TaskStatus } from '@prisma/client';
export declare class WorkspacesController {
    private readonly workspacesService;
    constructor(workspacesService: WorkspacesService);
    getUserWorkspaces(userId: string): Promise<{
        role: import("@prisma/client").$Enums.WorkspaceRole;
        projects: {
            id: string;
            workspaceId: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            key: string;
            description: string | null;
            color: string | null;
        }[];
        members: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
            userId: string;
            createdAt: Date;
        })[];
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
    }[]>;
    getInvitationByToken(token: string): Promise<{
        workspace: {
            id: string;
            name: string;
            slug: string;
        };
        invitedBy: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        role: import("@prisma/client").$Enums.WorkspaceRole;
        workspaceId: string;
        createdAt: Date;
        email: string;
        updatedAt: Date;
        token: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        invitedById: string;
    }>;
    acceptInvitation(token: string, userId: string): Promise<{
        success: boolean;
        message: string;
        workspace: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            slug: string;
            logoUrl: string | null;
            columnOrder: string[];
            cyclesEnabled: boolean;
        };
        membership: {
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
            userId: string;
            createdAt: Date;
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
            name: string;
            updatedAt: Date;
            slug: string;
            logoUrl: string | null;
            columnOrder: string[];
            cyclesEnabled: boolean;
        };
        membership: {
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
            userId: string;
            createdAt: Date;
        };
    }>;
    getWorkspaceById(id: string, userId: string): Promise<{
        role: import("@prisma/client").$Enums.WorkspaceRole;
        projects: {
            id: string;
            workspaceId: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            key: string;
            description: string | null;
            color: string | null;
        }[];
        members: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
            userId: string;
            createdAt: Date;
        })[];
        divisions: ({
            members: ({
                user: {
                    id: string;
                    email: string;
                    name: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                role: string | null;
                userId: string;
                createdAt: Date;
                divisionId: string;
            })[];
        } & {
            id: string;
            workspaceId: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            slug: string;
            description: string | null;
            isTechnical: boolean;
        })[];
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
    }>;
    updateWorkspace(id: string, userId: string, body: {
        name?: string;
        cyclesEnabled?: boolean;
        logoUrl?: string | null;
    }): Promise<{
        role: "OWNER" | "ADMIN";
        projects: {
            id: string;
            workspaceId: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            key: string;
            description: string | null;
            color: string | null;
        }[];
        members: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
            userId: string;
            createdAt: Date;
        })[];
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
    }>;
    createWorkspace(userId: string, body: {
        name: string;
    }): Promise<{
        projects: {
            id: string;
            workspaceId: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            key: string;
            description: string | null;
            color: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
    }>;
    getWorkspaceMembers(id: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        role: import("@prisma/client").$Enums.WorkspaceRole;
        workspaceId: string;
        userId: string;
        createdAt: Date;
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
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
            createdAt: Date;
            email: string;
            updatedAt: Date;
            token: string;
            status: import("@prisma/client").$Enums.InvitationStatus;
            invitedById: string;
        };
    }>;
    getWorkspaceInvitations(workspaceId: string, userId: string): Promise<({
        invitedBy: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        role: import("@prisma/client").$Enums.WorkspaceRole;
        workspaceId: string;
        createdAt: Date;
        email: string;
        updatedAt: Date;
        token: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        invitedById: string;
    })[]>;
    cancelInvitation(workspaceId: string, invitationId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateMemberRole(workspaceId: string, memberId: string, role: WorkspaceRole): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        role: import("@prisma/client").$Enums.WorkspaceRole;
        workspaceId: string;
        userId: string;
        createdAt: Date;
    }>;
    removeMember(workspaceId: string, memberId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getWorkspaceSections(id: string): Promise<{
        id: string;
        workspaceId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        key: string;
        color: string;
        order: number;
        category: import("@prisma/client").$Enums.TaskStatus;
    }[]>;
    createWorkspaceSection(id: string, body: {
        name: string;
        key?: string;
        color?: string;
        category?: TaskStatus;
    }): Promise<{
        id: string;
        workspaceId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        key: string;
        color: string;
        order: number;
        category: import("@prisma/client").$Enums.TaskStatus;
    }>;
    deleteWorkspaceSection(id: string, sectionId: string): Promise<{
        id: string;
        workspaceId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        key: string;
        color: string;
        order: number;
        category: import("@prisma/client").$Enums.TaskStatus;
    }>;
    updateColumnOrder(id: string, body: {
        columnOrder: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
    }>;
    getDivisions(workspaceId: string): Promise<({
        _count: {
            assignedTasks: number;
            requestedTasks: number;
        };
        members: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: string | null;
            userId: string;
            createdAt: Date;
            divisionId: string;
        })[];
    } & {
        id: string;
        workspaceId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        description: string | null;
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
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: string | null;
            userId: string;
            createdAt: Date;
            divisionId: string;
        })[];
    } & {
        id: string;
        workspaceId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        description: string | null;
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
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: string | null;
            userId: string;
            createdAt: Date;
            divisionId: string;
        })[];
    } & {
        id: string;
        workspaceId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        description: string | null;
        isTechnical: boolean;
    }>;
    deleteDivision(divisionId: string, userId: string): Promise<{
        id: string;
        workspaceId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        description: string | null;
        isTechnical: boolean;
    }>;
    addDivisionMember(divisionId: string, userId: string, body: {
        userId: string;
        role?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
        division: {
            id: string;
            workspaceId: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            slug: string;
            description: string | null;
            isTechnical: boolean;
        };
    } & {
        id: string;
        role: string | null;
        userId: string;
        createdAt: Date;
        divisionId: string;
    }>;
    removeDivisionMember(divisionId: string, targetUserId: string, userId: string): Promise<{
        id: string;
        role: string | null;
        userId: string;
        createdAt: Date;
        divisionId: string;
    }>;
}
