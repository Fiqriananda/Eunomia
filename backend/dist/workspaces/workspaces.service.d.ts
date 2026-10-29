import { PrismaService } from '../prisma/prisma.service.js';
import { WorkspaceRole } from '@prisma/client';
import { EmailService } from '../email/email.service.js';
import { EventsGateway } from '../events/events.gateway.js';
import { JwtService } from '@nestjs/jwt';
export declare class WorkspacesService {
    private prisma;
    private emailService;
    private eventsGateway;
    private jwtService;
    constructor(prisma: PrismaService, emailService: EmailService, eventsGateway: EventsGateway, jwtService: JwtService);
    getUserWorkspaces(userId: string): Promise<{
        role: import("@prisma/client").$Enums.WorkspaceRole;
        members: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            userId: string;
            workspaceId: string;
        })[];
        projects: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            description: string | null;
            color: string | null;
            workspaceId: string;
        }[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
    }[]>;
    getWorkspaceById(workspaceId: string, userId: string): Promise<{
        role: import("@prisma/client").$Enums.WorkspaceRole;
        members: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            userId: string;
            workspaceId: string;
        })[];
        projects: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            description: string | null;
            color: string | null;
            workspaceId: string;
        }[];
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
                createdAt: Date;
                role: string | null;
                userId: string;
                divisionId: string;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            workspaceId: string;
            isTechnical: boolean;
        })[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
    }>;
    createWorkspace(userId: string, data: {
        name: string;
    }): Promise<{
        projects: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            description: string | null;
            color: string | null;
            workspaceId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
    }>;
    inviteMember(workspaceId: string, currentUserId: string, data: {
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
            email: string;
            createdAt: Date;
            updatedAt: Date;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
            token: string;
            status: import("@prisma/client").$Enums.InvitationStatus;
            invitedById: string;
        };
    }>;
    getWorkspaceMembers(workspaceId: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        role: import("@prisma/client").$Enums.WorkspaceRole;
        userId: string;
        workspaceId: string;
    })[]>;
    getWorkspaceSections(workspaceId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        color: string;
        workspaceId: string;
        order: number;
        category: import("@prisma/client").$Enums.TaskStatus;
    }[]>;
    createWorkspaceSection(workspaceId: string, data: {
        name: string;
        key?: string;
        color?: string;
        category?: any;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        color: string;
        workspaceId: string;
        order: number;
        category: import("@prisma/client").$Enums.TaskStatus;
    }>;
    deleteWorkspaceSection(workspaceId: string, sectionId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        color: string;
        workspaceId: string;
        order: number;
        category: import("@prisma/client").$Enums.TaskStatus;
    }>;
    updateColumnOrder(workspaceId: string, columnOrder: string[]): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
    }>;
    updateWorkspace(workspaceId: string, userId: string, data: {
        name?: string;
        cyclesEnabled?: boolean;
        logoUrl?: string | null;
    }): Promise<{
        role: "OWNER" | "ADMIN";
        members: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            userId: string;
            workspaceId: string;
        })[];
        projects: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            description: string | null;
            color: string | null;
            workspaceId: string;
        }[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        columnOrder: string[];
        cyclesEnabled: boolean;
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
        createdAt: Date;
        role: import("@prisma/client").$Enums.WorkspaceRole;
        userId: string;
        workspaceId: string;
    }>;
    removeMember(workspaceId: string, memberId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getWorkspaceInvitations(workspaceId: string, currentUserId: string): Promise<({
        invitedBy: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        role: import("@prisma/client").$Enums.WorkspaceRole;
        workspaceId: string;
        token: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        invitedById: string;
    })[]>;
    cancelInvitation(workspaceId: string, invitationId: string, currentUserId: string): Promise<{
        success: boolean;
        message: string;
    }>;
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
        email: string;
        createdAt: Date;
        updatedAt: Date;
        role: import("@prisma/client").$Enums.WorkspaceRole;
        workspaceId: string;
        token: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        invitedById: string;
    }>;
    acceptInvitation(tokenOrId: string, currentUserId: string): Promise<{
        success: boolean;
        message: string;
        workspace: {
            id: string;
            name: string;
            createdAt: Date;
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
            createdAt: Date;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            userId: string;
            workspaceId: string;
        };
    }>;
    declineInvitation(tokenOrId: string, currentUserId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    acceptInvitationPublic(token: string, data?: {
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
            name: string;
            createdAt: Date;
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
            createdAt: Date;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            userId: string;
            workspaceId: string;
        };
    }>;
    ensureDefaultDivisions(workspaceId: string): Promise<void>;
    getWorkspaceDivisions(workspaceId: string): Promise<({
        members: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            role: string | null;
            userId: string;
            divisionId: string;
        })[];
        _count: {
            assignedTasks: number;
            requestedTasks: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        workspaceId: string;
        isTechnical: boolean;
    })[]>;
    createDivision(workspaceId: string, userId: string, data: {
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
            createdAt: Date;
            role: string | null;
            userId: string;
            divisionId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        workspaceId: string;
        isTechnical: boolean;
    }>;
    updateDivision(divisionId: string, userId: string, data: {
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
            createdAt: Date;
            role: string | null;
            userId: string;
            divisionId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        workspaceId: string;
        isTechnical: boolean;
    }>;
    deleteDivision(divisionId: string, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        workspaceId: string;
        isTechnical: boolean;
    }>;
    addDivisionMember(divisionId: string, userId: string, targetUserId: string, role?: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
        division: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            workspaceId: string;
            isTechnical: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        role: string | null;
        userId: string;
        divisionId: string;
    }>;
    removeDivisionMember(divisionId: string, userId: string, targetUserId: string): Promise<{
        id: string;
        createdAt: Date;
        role: string | null;
        userId: string;
        divisionId: string;
    }>;
}
