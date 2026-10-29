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
        };
        workspace: {
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
        };
        defaultProject: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            key: string;
            color: string | null;
            workspaceId: string;
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
        };
        workspace: {
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
        };
        defaultProject: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            key: string;
            color: string | null;
            workspaceId: string;
        };
    }>;
    getMe(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
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
    }): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
    }>;
}
