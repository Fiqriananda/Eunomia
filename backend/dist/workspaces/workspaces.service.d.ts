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
    getWorkspaceById(workspaceId: string, userId: string): Promise<{
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
    createWorkspace(userId: string, data: {
        name: string;
        ticketPrefix?: string;
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
    getWorkspaceMembers(workspaceId: string): Promise<({
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
    getWorkspaceSections(workspaceId: string): Promise<{
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
    createWorkspaceSection(workspaceId: string, data: {
        name: string;
        key?: string;
        color?: string;
        progress?: string;
        category?: any;
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
    updateWorkspaceSection(workspaceId: string, sectionIdOrKey: string, data: {
        name?: string;
        color?: string;
        progress?: string;
        category?: any;
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
    deleteWorkspaceSection(workspaceId: string, sectionId: string): Promise<{
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
    updateColumnOrder(workspaceId: string, columnOrder: string[]): Promise<{
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
    updateWorkspace(workspaceId: string, userId: string, data: {
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
    getWorkspaceInvitations(workspaceId: string, currentUserId: string): Promise<({
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
    acceptInvitation(tokenOrId: string, currentUserId: string): Promise<{
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
    ensureDefaultDivisions(workspaceId: string): Promise<void>;
    getWorkspaceDivisions(workspaceId: string): Promise<({
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
    createDivision(workspaceId: string, userId: string, data: {
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
    updateDivision(divisionId: string, userId: string, data: {
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
    addDivisionMember(divisionId: string, userId: string, targetUserId: string, role?: string): Promise<{
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
    removeDivisionMember(divisionId: string, userId: string, targetUserId: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        role: string | null;
        divisionId: string;
    }>;
}
