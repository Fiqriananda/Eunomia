import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
export declare class AuthService {
    private prisma;
    private jwtService;
    private notificationsService;
    constructor(prisma: PrismaService, jwtService: JwtService, notificationsService: NotificationsService);
    register(data: {
        email: string;
        password: string;
        name: string;
        fcmToken?: string;
        deviceToken?: string;
        platform?: string;
        deviceModel?: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
            whatsappNumber: string | null;
            whatsappNotifications: boolean;
        };
        workspace: {
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
        };
        defaultProject: {
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
        };
    }>;
    login(data: {
        email: string;
        password: string;
        fcmToken?: string;
        deviceToken?: string;
        platform?: string;
        deviceModel?: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
            whatsappNumber: string | null;
            whatsappNotifications: boolean;
        };
        workspace: {
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
        };
        defaultProject: {
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
        };
    }>;
    getMe(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        whatsappNumber: string | null;
        whatsappNotifications: boolean;
        workspaces: ({
            workspace: {
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
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            workspaceId: string;
        })[];
    }>;
    updateProfile(userId: string, data: {
        name?: string;
        avatarUrl?: string;
        email?: string;
        currentPassword?: string;
        newPassword?: string;
        whatsappNumber?: string | null;
        whatsappNotifications?: boolean;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        whatsappNumber: string | null;
        whatsappNotifications: boolean;
    }>;
}
