import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TasksService } from '../tasks/tasks.service.js';
import { InboxService } from '../inbox/inbox.service.js';
import { TaskStatus, TaskPriority } from '@prisma/client';
import {
  MobileHomeQueryDto,
  MobileHomeResponseDto,
  MobileCompactTaskDto,
} from './dto/mobile-home.dto.js';
import {
  MobileTasksQueryDto,
  MobileTaskFilter,
  MobilePaginatedTasksResponseDto,
  MobileCreateTaskDto,
} from './dto/mobile-tasks.dto.js';
import { MobileTaskDetailDto } from './dto/mobile-task-detail.dto.js';
import { MobileNotificationsResponseDto } from './dto/mobile-notifications.dto.js';
import { MobileConfigResponseDto } from './dto/mobile-config.dto.js';

@Injectable()
export class MobileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly inboxService: InboxService,
  ) {}

  private mapToCompactTask(task: any): MobileCompactTaskDto {
    const subtasks = task.subTasks || [];
    const completedSubtasks = subtasks.filter(
      (s: any) => s.status === TaskStatus.DONE,
    ).length;

    return {
      id: task.id,
      identifier: task.identifier,
      title: task.title,
      description: task.description,
      status: task.status,
      customStatus: task.customStatus,
      priority: task.priority,
      dueDate: task.dueDate,
      labels: task.labels || [],
      project: task.project
        ? {
            id: task.project.id,
            name: task.project.name,
            key: task.project.key,
            color: task.project.color,
          }
        : undefined,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.name,
            avatarUrl: task.assignee.avatarUrl,
          }
        : null,
      subtasksCount: subtasks.length,
      subtasksCompletedCount: completedSubtasks,
      commentsCount: task._count?.comments ?? (task.comments ? task.comments.length : 0),
      attachmentsCount: task._count?.attachments ?? (task.attachments ? task.attachments.length : 0),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  async getHome(userId: string, query: MobileHomeQueryDto): Promise<MobileHomeResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const availableWorkspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
    }));

    let currentWorkspace = availableWorkspaces[0];
    if (query.workspaceId) {
      const match = availableWorkspaces.find((w) => w.id === query.workspaceId);
      if (match) {
        currentWorkspace = match;
      }
    }

    if (!currentWorkspace) {
      // Fallback if user has no workspace yet
      return {
        user,
        currentWorkspace: {
          id: '',
          name: 'No Workspace',
          slug: 'none',
        },
        availableWorkspaces: [],
        stats: {
          assignedCount: 0,
          inProgressCount: 0,
          dueSoonCount: 0,
          urgentCount: 0,
          completedThisWeekCount: 0,
          unreadNotificationsCount: 0,
        },
        myAssignedTasks: [],
        projects: [],
        statusBreakdown: [],
      };
    }

    const workspaceId = currentWorkspace.id;
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)); // Monday

    const [
      assignedCount,
      inProgressCount,
      dueSoonCount,
      urgentCount,
      completedThisWeekCount,
      unreadNotificationsCount,
      rawAssignedTasks,
      projectsList,
      tasksForStatusCount,
    ] = await Promise.all([
      // 1. Total assigned to me
      this.prisma.task.count({
        where: {
          workspaceId,
          assigneeId: userId,
          status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELED] },
        },
      }),
      // 2. In progress for me
      this.prisma.task.count({
        where: {
          workspaceId,
          assigneeId: userId,
          status: TaskStatus.IN_PROGRESS,
        },
      }),
      // 3. Due soon (next 48h or overdue)
      this.prisma.task.count({
        where: {
          workspaceId,
          assigneeId: userId,
          dueDate: { lte: in48Hours },
          status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELED] },
        },
      }),
      // 4. Urgent or High priority assigned to me
      this.prisma.task.count({
        where: {
          workspaceId,
          assigneeId: userId,
          priority: { in: [TaskPriority.HIGH, TaskPriority.URGENT] },
          status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELED] },
        },
      }),
      // 5. Completed this week
      this.prisma.task.count({
        where: {
          workspaceId,
          assigneeId: userId,
          status: TaskStatus.DONE,
          updatedAt: { gte: startOfWeek },
        },
      }),
      // 6. Unread inbox notifications
      this.prisma.inboxNotification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
      // 7. Top assigned tasks (max 10)
      this.prisma.task.findMany({
        where: {
          workspaceId,
          assigneeId: userId,
          status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELED] },
        },
        include: {
          project: { select: { id: true, name: true, key: true, color: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          subTasks: { select: { id: true, status: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { updatedAt: 'desc' }],
        take: 10,
      }),
      // 8. Projects with task count
      this.prisma.project.findMany({
        where: { workspaceId },
        select: {
          id: true,
          name: true,
          key: true,
          color: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { name: 'asc' },
      }),
      // 9. Status breakdown
      this.prisma.task.groupBy({
        by: ['status'],
        where: { workspaceId },
        _count: { _all: true },
      }),
    ]);

    const statusLabels: Record<TaskStatus, string> = {
      BACKLOG: 'Backlog',
      TODO: 'Todo',
      IN_PROGRESS: 'In Progress',
      DONE: 'Done',
      CANCELED: 'Canceled',
    };

    const statusCountMap = new Map<TaskStatus, number>(
      tasksForStatusCount.map((item) => [item.status, item._count._all]),
    );

    const statusBreakdown = (Object.keys(statusLabels) as TaskStatus[]).map((status) => ({
      status,
      label: statusLabels[status],
      count: statusCountMap.get(status) || 0,
    }));

    return {
      user,
      currentWorkspace,
      availableWorkspaces,
      stats: {
        assignedCount,
        inProgressCount,
        dueSoonCount,
        urgentCount,
        completedThisWeekCount,
        unreadNotificationsCount,
      },
      myAssignedTasks: rawAssignedTasks.map((t) => this.mapToCompactTask(t)),
      projects: projectsList.map((p) => ({
        id: p.id,
        name: p.name,
        key: p.key,
        color: p.color,
        taskCount: p._count.tasks,
      })),
      statusBreakdown,
    };
  }

  async getTasks(userId: string, query: MobileTasksQueryDto): Promise<MobilePaginatedTasksResponseDto> {
    let workspaceId = query.workspaceId;
    if (!workspaceId) {
      const firstMembership = await this.prisma.workspaceMember.findFirst({
        where: { userId },
        select: { workspaceId: true },
        orderBy: { createdAt: 'asc' },
      });
      workspaceId = firstMembership?.workspaceId;
    }

    if (!workspaceId) {
      return {
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      };
    }

    const where: any = { workspaceId };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    const filter = query.filter || MobileTaskFilter.ASSIGNED_TO_ME;
    if (filter === MobileTaskFilter.ASSIGNED_TO_ME) {
      where.assigneeId = userId;
    } else if (filter === MobileTaskFilter.CREATED_BY_ME) {
      where.creatorId = userId;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { identifier: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [total, rawTasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, key: true, color: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          subTasks: { select: { id: true, status: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: rawTasks.map((t) => this.mapToCompactTask(t)),
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getTaskDetail(userId: string, taskId: string): Promise<MobileTaskDetailDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        project: { select: { id: true, name: true, key: true, color: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        parent: { select: { id: true, identifier: true, title: true } },
        subTasks: {
          select: {
            id: true,
            identifier: true,
            title: true,
            status: true,
            priority: true,
            assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            url: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return task as unknown as MobileTaskDetailDto;
  }

  async createTask(userId: string, dto: MobileCreateTaskDto) {
    let workspaceId = dto.workspaceId;
    if (!workspaceId) {
      const membership = await this.prisma.workspaceMember.findFirst({
        where: { userId },
        select: { workspaceId: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!membership) {
        throw new BadRequestException('User does not belong to any workspace');
      }
      workspaceId = membership.workspaceId;
    }

    let projectId = dto.projectId;
    if (!projectId) {
      const project = await this.prisma.project.findFirst({
        where: { workspaceId },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!project) {
        throw new BadRequestException('No project found in this workspace to assign the task to');
      }
      projectId = project.id;
    }

    return this.tasksService.createTask(userId, {
      workspaceId,
      projectId,
      title: dto.title,
      description: dto.description,
      status: dto.status || TaskStatus.TODO,
      priority: dto.priority || TaskPriority.NO_PRIORITY,
      assigneeId: dto.assigneeId,
      dueDate: dto.dueDate,
      labels: dto.labels,
      parentId: dto.parentId,
    });
  }

  async updateTaskStatus(userId: string, taskId: string, status: TaskStatus, customStatus?: string) {
    return this.tasksService.updateTask(
      taskId,
      {
        status,
        customStatus: customStatus || null,
      },
      userId,
    );
  }

  async updateTaskPriority(userId: string, taskId: string, priority: TaskPriority) {
    return this.tasksService.updateTask(taskId, { priority }, userId);
  }

  async addComment(userId: string, taskId: string, content: string) {
    return this.tasksService.addComment(taskId, userId, content);
  }

  async getNotifications(userId: string, unreadOnly?: boolean): Promise<MobileNotificationsResponseDto> {
    const notifications = await this.inboxService.getNotifications(userId, unreadOnly);
    const unreadCount = await this.prisma.inboxNotification.count({
      where: { userId, isRead: false },
    });

    return {
      notifications: notifications as any,
      unreadCount,
    };
  }

  async markNotificationRead(userId: string, notificationId: string) {
    return this.inboxService.markAsRead(notificationId, userId);
  }

  async markAllNotificationsRead(userId: string) {
    return this.inboxService.markAllAsRead(userId);
  }

  getConfig(): MobileConfigResponseDto {
    return {
      apiVersion: '1.0.0',
      minSupportedAppVersion: '1.0.0',
      serverTime: new Date().toISOString(),
      statuses: [
        { key: TaskStatus.BACKLOG, label: 'Backlog', color: '#94a3b8' },
        { key: TaskStatus.TODO, label: 'Todo', color: '#e2e8f0' },
        { key: TaskStatus.IN_PROGRESS, label: 'In Progress', color: '#f59e0b' },
        { key: TaskStatus.DONE, label: 'Done', color: '#6366f1' },
        { key: TaskStatus.CANCELED, label: 'Canceled', color: '#64748b' },
      ],
      priorities: [
        { key: TaskPriority.NO_PRIORITY, label: 'No Priority', level: 0, color: '#94a3b8' },
        { key: TaskPriority.LOW, label: 'Low', level: 1, color: '#0ea5e9' },
        { key: TaskPriority.MEDIUM, label: 'Medium', level: 2, color: '#f59e0b' },
        { key: TaskPriority.HIGH, label: 'High', level: 3, color: '#f97316' },
        { key: TaskPriority.URGENT, label: 'Urgent', level: 4, color: '#f43f5e' },
      ],
      features: {
        fileUploads: true,
        subtasks: true,
        relations: true,
        inbox: true,
        pushNotifications: false,
      },
    };
  }
}
