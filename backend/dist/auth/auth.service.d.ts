import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(data: {
        email: string;
        password: string;
        name: string;
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
        };
        defaultProject: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            description: string | null;
            color: string | null;
            workspaceId: string;
        };
    }>;
    login(data: {
        email: string;
        password: string;
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
        };
        defaultProject: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            key: string;
            description: string | null;
            color: string | null;
            workspaceId: string;
        };
    }>;
    getMe(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
        workspaces: ({
            workspace: {
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
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                logoUrl: string | null;
                columnOrder: string[];
                cyclesEnabled: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            userId: string;
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
        email: string;
        name: string;
        avatarUrl: string | null;
    }>;
}
