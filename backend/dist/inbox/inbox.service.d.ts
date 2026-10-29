import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
export declare class InboxService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    getNotifications(userId: string, unreadOnly?: boolean): Promise<{
        notifications: ({
            workspace: {
                id: string;
                name: string;
                slug: string;
            } | null;
            task: {
                project: {
                    id: string;
                    name: string;
                    key: string;
                    color: string | null;
                };
                title: string;
                id: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
                identifier: string;
                status: import("@prisma/client").$Enums.TaskStatus;
            } | null;
            actor: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            invitation: {
                token: string;
                id: string;
                role: import("@prisma/client").$Enums.WorkspaceRole;
                status: import("@prisma/client").$Enums.InvitationStatus;
            } | null;
        } & {
            type: string;
            title: string;
            body: string | null;
            id: string;
            userId: string;
            createdAt: Date;
            taskId: string | null;
            workspaceId: string | null;
            isRead: boolean;
            readAt: Date | null;
            actorId: string;
            invitationId: string | null;
        })[];
        unreadCount: number;
    }>;
    markAsRead(id: string, userId: string): Promise<{
        task: {
            title: string;
            id: string;
            identifier: string;
            status: import("@prisma/client").$Enums.TaskStatus;
        } | null;
        actor: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        type: string;
        title: string;
        body: string | null;
        id: string;
        userId: string;
        createdAt: Date;
        taskId: string | null;
        workspaceId: string | null;
        isRead: boolean;
        readAt: Date | null;
        actorId: string;
        invitationId: string | null;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
    deleteNotification(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    createNotification(data: {
        userId: string;
        actorId: string;
        taskId: string;
        type: 'ASSIGNED' | 'MENTIONED' | 'COMMENT_REPLY' | 'TASK_UPDATE' | 'WORKSPACE_INVITATION';
        title: string;
        body?: string;
    }): Promise<{
        type: string;
        title: string;
        body: string | null;
        id: string;
        userId: string;
        createdAt: Date;
        taskId: string | null;
        workspaceId: string | null;
        isRead: boolean;
        readAt: Date | null;
        actorId: string;
        invitationId: string | null;
    } | null>;
}
