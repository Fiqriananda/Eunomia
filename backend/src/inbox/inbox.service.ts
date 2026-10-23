import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class InboxService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string, unreadOnly = false) {
    const where: any = { userId };
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

  async markAsRead(id: string, userId: string) {
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

  async markAllAsRead(userId: string) {
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

  async deleteNotification(id: string, userId: string) {
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

  async createNotification(data: {
    userId: string;
    actorId: string;
    taskId: string;
    type: 'ASSIGNED' | 'MENTIONED' | 'COMMENT_REPLY' | 'TASK_UPDATE' | 'WORKSPACE_INVITATION';
    title: string;
    body?: string;
  }) {
    if (data.userId === data.actorId) {
      return null;
    }

    return this.prisma.inboxNotification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        taskId: data.taskId,
        type: data.type,
        title: data.title,
        body: data.body,
      },
    });
  }
}
