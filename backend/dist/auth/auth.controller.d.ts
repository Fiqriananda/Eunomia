import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto/auth.dto.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: RegisterDto): Promise<{
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
    login(body: LoginDto): Promise<{
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
    updateProfile(userId: string, body: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
    }>;
}
