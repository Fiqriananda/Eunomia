import { InboxService } from './inbox.service.js';
export declare class InboxController {
    private readonly inboxService;
    constructor(inboxService: InboxService);
    getNotifications(userId: string, unreadOnly?: string): Promise<{
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
                id: string;
                status: import("@prisma/client").$Enums.TaskStatus;
                title: string;
                identifier: string;
                priority: import("@prisma/client").$Enums.TaskPriority;
            } | null;
            actor: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
            invitation: {
                id: string;
                role: import("@prisma/client").$Enums.WorkspaceRole;
                token: string;
                status: import("@prisma/client").$Enums.InvitationStatus;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            workspaceId: string | null;
            type: string;
            title: string;
            body: string | null;
            isRead: boolean;
            readAt: Date | null;
            actorId: string;
            taskId: string | null;
            invitationId: string | null;
        })[];
        unreadCount: number;
    }>;
    markAsRead(id: string, userId: string): Promise<{
        task: {
            id: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            title: string;
            identifier: string;
        } | null;
        actor: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        workspaceId: string | null;
        type: string;
        title: string;
        body: string | null;
        isRead: boolean;
        readAt: Date | null;
        actorId: string;
        taskId: string | null;
        invitationId: string | null;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
    deleteNotification(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
