var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
let InboxService = class InboxService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async getNotifications(userId, unreadOnly = false) {
        const where = { userId };
        if (unreadOnly) {
            where.isRead = false;
        }
        const [notifications, unreadCount] = await Promise.all([
            this.prisma.inboxNotification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    task: {
                        select: {
                            id: true,
                            identifier: true,
                            title: true,
                            status: true,
                            priority: true,
                            project: {
                                select: {
                                    id: true,
                                    name: true,
                                    key: true,
                                    color: true,
                                },
                            },
                        },
                    },
                    workspace: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    invitation: {
                        select: {
                            id: true,
                            token: true,
                            role: true,
                            status: true,
                        },
                    },
                    actor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                },
            }),
            this.prisma.inboxNotification.count({
                where: {
                    userId,
                    isRead: false,
                },
            }),
        ]);
        return {
            notifications,
            unreadCount,
        };
    }
    async markAsRead(id, userId) {
        const notification = await this.prisma.inboxNotification.findFirst({
            where: { id, userId },
        });
        if (!notification) {
            throw new NotFoundException('Notification not found');
        }
        return this.prisma.inboxNotification.update({
            where: { id },
            data: {
                isRead: true,
                readAt: new Date(),
            },
            include: {
                task: {
                    select: {
                        id: true,
                        identifier: true,
                        title: true,
                        status: true,
                    },
                },
                actor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }
    async markAllAsRead(userId) {
        await this.prisma.inboxNotification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        return { success: true };
    }
    async deleteNotification(id, userId) {
        const notification = await this.prisma.inboxNotification.findFirst({
            where: { id, userId },
        });
        if (!notification) {
            throw new NotFoundException('Notification not found');
        }
        await this.prisma.inboxNotification.delete({
            where: { id },
        });
        return { success: true };
    }
    async createNotification(data) {
        if (data.userId === data.actorId) {
            return null;
        }
        const created = await this.prisma.inboxNotification.create({
            data: {
                userId: data.userId,
                actorId: data.actorId,
                taskId: data.taskId,
                type: data.type,
                title: data.title,
                body: data.body,
            },
        });
        this.notificationsService
            .sendToUser(data.userId, {
            title: data.title,
            body: data.body || data.title,
            data: {
                type: data.type,
                taskId: data.taskId,
            },
        })
            .catch((err) => console.error('Failed to send push notification from InboxService:', err));
        return created;
    }
};
InboxService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        NotificationsService])
], InboxService);
export { InboxService };
//# sourceMappingURL=inbox.service.js.map