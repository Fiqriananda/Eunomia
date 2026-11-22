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
    login(body: LoginDto): Promise<{
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
    updateProfile(userId: string, body: UpdateProfileDto): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        whatsappNumber: string | null;
        whatsappNotifications: boolean;
    }>;
}
