import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TasksService } from '../tasks/tasks.service.js';
import { InboxService } from '../inbox/inbox.service.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { CyclesService } from '../cycles/cycles.service.js';
import { AuthService } from '../auth/auth.service.js';
import { TaskStatus, TaskPriority, WorkspaceRole } from '@prisma/client';
import {
  MobileHomeQueryDto,
  MobileHomeResponseDto,
  MobileCompactTaskDto,
  MobileStatusCountDto,
  MobileProjectSummaryDto,
} from './dto/mobile-home.dto.js';
import {
  MobileTasksQueryDto,
  MobileTaskFilter,
  MobilePaginatedTasksResponseDto,
  MobileCreateTaskDto,
  MobileUpdateTaskDto,
  MobileCreateSubtaskDto,
  MobileCreateRelationDto,
  MobileTaskRelationDto,
  MobileCommentDto,
  MobileTaskActivityDto,
} from './dto/mobile-tasks.dto.js';
import { MobileTaskDetailDto } from './dto/mobile-task-detail.dto.js';
import { MobileNotificationsResponseDto } from './dto/mobile-notifications.dto.js';
import { MobileConfigResponseDto } from './dto/mobile-config.dto.js';
import {
  MobileWorkspaceListResponseDto,
  MobileWorkspaceMemberDto,
  MobileCreateWorkspaceDto,
  MobileInviteMemberDto,
} from './dto/mobile-workspaces.dto.js';
import {
  MobileProjectDto,
  MobileCreateProjectDto,
  MobileUpdateProjectDto,
  MobileProjectDetailDto,
} from './dto/mobile-projects.dto.js';
import {
  MobileCycleDto,
  MobileCreateCycleDto,
  MobileUpdateCycleDto,
  MobileCycleDetailDto,
} from './dto/mobile-cycles.dto.js';
import { MobileTrashListResponseDto } from './dto/mobile-trash.dto.js';
import {
  MobileSearchQueryDto,
  MobileSearchResultDto,
} from './dto/mobile-search.dto.js';
import {
  MobileProfileResponseDto,
  MobileUpdateProfileDto,
  MobileChangePasswordDto,
  MobileUserHoverCardDto,
} from './dto/mobile-profile.dto.js';
import { MobileAdminPerformanceResponseDto } from './dto/mobile-performance.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RegisterDeviceTokenDto } from '../notifications/dto/device-token.dto.js';

@Injectable()
export class MobileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly inboxService: InboxService,
    private readonly workspacesService: WorkspacesService,
    private readonly projectsService: ProjectsService,
    private readonly cyclesService: CyclesService,
    private readonly authService: AuthService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getEffectiveWorkspaceId(userId: string, workspaceId?: string): Promise<string> {
    if (workspaceId) return workspaceId;
    const member = await this.prisma.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!member) {
      throw new NotFoundException('No active workspace found for user');
    }
    return member.workspaceId;
  }

  private getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  private getAvatarColor(name?: string): string {
    if (!name) return '#00b4d8';
    if (name.toLowerCase().includes('mohab')) return '#00b4d8';
    const palette = ['#00b4d8', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#f97316'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

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

  // 1. Mobile Config
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
      supportedRelations: ['BLOCKS', 'BLOCKED_BY', 'RELATES_TO', 'DUPLICATE'],
      supportedEmojis: ['👍', '❤️', '🎉', '🚀', '👀', '🔥', '💡', '👎', '👏', '✨', '🙏', '💯'],
      features: {
        fileUploads: true,
        subtasks: true,
        relations: true,
        cycles: true,
        trash: true,
        inbox: true,
        hoverCard: true,
        pushNotifications: false,
      },
    };
  }

  // 2. Mobile Home Dashboard
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
          select: { id: true, name: true, slug: true, cyclesEnabled: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const availableWorkspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      cyclesEnabled: m.workspace.cyclesEnabled ?? false,
    }));

    let currentWorkspace = availableWorkspaces[0];
    if (query.workspaceId) {
      const match = availableWorkspaces.find((w) => w.id === query.workspaceId);
      if (match) {
        currentWorkspace = match;
      }
    }

    if (!currentWorkspace) {
      return {
        user,
        currentWorkspace: null as any,
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
        statusBreakdown: [
          { status: TaskStatus.BACKLOG, label: 'Backlog', count: 0 },
          { status: TaskStatus.TODO, label: 'Todo', count: 0 },
          { status: TaskStatus.IN_PROGRESS, label: 'In Progress', count: 0 },
          { status: TaskStatus.DONE, label: 'Done', count: 0 },
          { status: TaskStatus.CANCELED, label: 'Canceled', count: 0 },
        ],
      };
    }

    const wsId = currentWorkspace.id;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [
      assignedCount,
      inProgressCount,
      dueSoonCount,
      urgentCount,
      completedThisWeekCount,
      unreadNotificationsCount,
      assignedTasksRaw,
      _urgentTasksRaw,
      projectsRaw,
      statusGroupRaw,
    ] = await Promise.all([
      this.prisma.task.count({
        where: { workspaceId: wsId, assigneeId: userId, isArchived: false, status: { not: TaskStatus.DONE } },
      }),
      this.prisma.task.count({
        where: { workspaceId: wsId, assigneeId: userId, isArchived: false, status: TaskStatus.IN_PROGRESS },
      }),
      this.prisma.task.count({
        where: {
          workspaceId: wsId,
          assigneeId: userId,
          isArchived: false,
          status: { not: TaskStatus.DONE },
          dueDate: { lte: endOfToday },
        },
      }),
      this.prisma.task.count({
        where: {
          workspaceId: wsId,
          assigneeId: userId,
          isArchived: false,
          status: { not: TaskStatus.DONE },
          priority: { in: [TaskPriority.HIGH, TaskPriority.URGENT] },
        },
      }),
      this.prisma.task.count({
        where: {
          workspaceId: wsId,
          assigneeId: userId,
          status: TaskStatus.DONE,
          updatedAt: { gte: oneWeekAgo },
        },
      }),
      this.prisma.inboxNotification.count({
        where: { userId, isRead: false },
      }),
      this.prisma.task.findMany({
        where: { workspaceId: wsId, assigneeId: userId, isArchived: false, status: { not: TaskStatus.DONE } },
        include: {
          project: { select: { id: true, name: true, key: true, color: true } },
        cycle: { select: { id: true, number: true, name: true, status: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          subTasks: { select: { id: true, status: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 5,
      }),
      this.prisma.task.findMany({
        where: {
          workspaceId: wsId,
          isArchived: false,
          status: { not: TaskStatus.DONE },
          priority: { in: [TaskPriority.HIGH, TaskPriority.URGENT] },
        },
        include: {
          project: { select: { id: true, name: true, key: true, color: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          subTasks: { select: { id: true, status: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      this.prisma.project.findMany({
        where: { workspaceId: wsId },
        include: {
          tasks: {
            where: { isArchived: false },
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { workspaceId: wsId, isArchived: false },
        _count: { status: true },
      }),
    ]);

    const statusBreakdown: MobileStatusCountDto[] = [
      { status: TaskStatus.BACKLOG, label: 'Backlog', count: 0 },
      { status: TaskStatus.TODO, label: 'Todo', count: 0 },
      { status: TaskStatus.IN_PROGRESS, label: 'In Progress', count: 0 },
      { status: TaskStatus.DONE, label: 'Done', count: 0 },
      { status: TaskStatus.CANCELED, label: 'Canceled', count: 0 },
    ];
    for (const group of statusGroupRaw) {
      const match = statusBreakdown.find((s) => s.status === group.status);
      if (match) {
        match.count = group._count.status;
      }
    }

    const projects: MobileProjectSummaryDto[] = projectsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      color: p.color,
      taskCount: p.tasks.length,
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
      myAssignedTasks: assignedTasksRaw.map((t) => this.mapToCompactTask(t)),
      projects,
      statusBreakdown,
    };
  }

  // 3. Workspaces & Members
  async getWorkspaces(userId: string): Promise<MobileWorkspaceListResponseDto> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: { members: true, projects: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: memberships.map((m, idx) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        membersCount: m.workspace._count.members,
        projectsCount: m.workspace._count.projects,
        cyclesEnabled: m.workspace.cyclesEnabled ?? true,
        isCurrent: idx === 0,
        createdAt: m.workspace.createdAt,
      })),
      total: memberships.length,
    };
  }

  async createWorkspace(userId: string, dto: MobileCreateWorkspaceDto) {
    return this.workspacesService.createWorkspace(userId, { name: dto.name });
  }

  async getWorkspaceMembers(workspaceId: string, currentUserId: string): Promise<MobileWorkspaceMemberDto[]> {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      user: {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
      },
      status: m.userId === currentUserId ? 'online' : 'offline',
      createdAt: m.createdAt,
    }));
  }

  async inviteWorkspaceMember(workspaceId: string, currentUserId: string, dto: MobileInviteMemberDto) {
    return this.workspacesService.inviteMember(
      workspaceId,
      currentUserId,
      {
        email: dto.email,
        role: dto.role || WorkspaceRole.MEMBER,
      },
    );
  }

  // 4. Projects
  async getProjects(userId: string, workspaceIdParam?: string): Promise<MobileProjectDto[]> {
    const workspaceId = await this.getEffectiveWorkspaceId(userId, workspaceIdParam);
    const projects = await this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        tasks: {
          where: { isArchived: false },
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === TaskStatus.DONE).length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        key: p.key,
        color: p.color,
        description: p.description,
        totalTasks,
        completedTasks,
        progressPercentage,
        createdAt: p.createdAt,
      };
    });
  }

  async createProject(userId: string, dto: MobileCreateProjectDto) {
    const workspaceId = await this.getEffectiveWorkspaceId(userId, dto.workspaceId);
    return this.projectsService.createProject(workspaceId, {
      name: dto.name,
      key: dto.key,
      description: dto.description,
      color: dto.color,
    });
  }

  async getProjectDetail(userId: string, projectId: string): Promise<MobileProjectDetailDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: { isArchived: false },
          include: {
            project: { select: { id: true, name: true, key: true, color: true } },
            assignee: { select: { id: true, name: true, avatarUrl: true } },
            subTasks: { select: { id: true, status: true } },
            _count: { select: { comments: true, attachments: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const statusBreakdown = {
      backlog: 0,
      todo: 0,
      inProgress: 0,
      done: 0,
      canceled: 0,
    };

    for (const t of project.tasks) {
      if (t.status === TaskStatus.BACKLOG) statusBreakdown.backlog++;
      if (t.status === TaskStatus.TODO) statusBreakdown.todo++;
      if (t.status === TaskStatus.IN_PROGRESS) statusBreakdown.inProgress++;
      if (t.status === TaskStatus.DONE) statusBreakdown.done++;
      if (t.status === TaskStatus.CANCELED) statusBreakdown.canceled++;
    }

    const totalTasks = project.tasks.length;
    const completedTasks = statusBreakdown.done;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: project.id,
      name: project.name,
      key: project.key,
      color: project.color,
      description: project.description,
      totalTasks,
      completedTasks,
      progressPercentage,
      createdAt: project.createdAt,
      statusBreakdown,
      recentTasks: project.tasks.slice(0, 15).map((t) => this.mapToCompactTask(t)),
    };
  }

  async updateProject(projectId: string, dto: MobileUpdateProjectDto) {
    return this.projectsService.updateProject(projectId, dto);
  }

  async deleteProject(projectId: string) {
    const existing = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) {
      throw new NotFoundException('Project not found');
    }
    return this.prisma.project.delete({ where: { id: projectId } });
  }

  // 5. Cycles (Sprints)
  async getCycles(userId: string, workspaceIdParam?: string): Promise<MobileCycleDto[]> {
    const workspaceId = await this.getEffectiveWorkspaceId(userId, workspaceIdParam);
    const cycles = await this.prisma.cycle.findMany({
      where: { workspaceId },
      include: {
        tasks: {
          where: { isArchived: false },
          select: { id: true, status: true },
        },
      },
      orderBy: { number: 'desc' },
    });

    return cycles.map((c) => {
      const totalTasks = c.tasks.length;
      const completedTasks = c.tasks.filter((t) => t.status === TaskStatus.DONE).length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: c.id,
        number: c.number,
        name: c.name,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        totalTasks,
        completedTasks,
        progressPercentage,
      };
    });
  }

  async getCurrentCycle(userId: string, workspaceIdParam?: string): Promise<MobileCycleDetailDto | null> {
    const workspaceId = await this.getEffectiveWorkspaceId(userId, workspaceIdParam);
    const cycle = await this.prisma.cycle.findFirst({
      where: { workspaceId, status: 'ACTIVE' },
      include: {
        tasks: {
          where: { isArchived: false },
          include: {
            project: { select: { id: true, name: true, key: true, color: true } },
            assignee: { select: { id: true, name: true, avatarUrl: true } },
            subTasks: { select: { id: true, status: true } },
            _count: { select: { comments: true, attachments: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cycle) return null;

    const totalTasks = cycle.tasks.length;
    const completedTasks = cycle.tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: cycle.id,
      number: cycle.number,
      name: cycle.name,
      status: cycle.status,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      totalTasks,
      completedTasks,
      progressPercentage,
      tasks: cycle.tasks.map((t) => this.mapToCompactTask(t)),
    };
  }

  async createCycle(userId: string, dto: MobileCreateCycleDto) {
    const workspaceId = await this.getEffectiveWorkspaceId(userId, dto.workspaceId);
    return this.cyclesService.createCycle({
      workspaceId,
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  async updateCycle(cycleId: string, dto: MobileUpdateCycleDto) {
    return this.cyclesService.updateCycle(cycleId, {
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status as any,
    });
  }

  // 6. Tasks
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

    const where: any = { workspaceId, isArchived: false };

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

  async updateTask(userId: string, taskId: string, dto: MobileUpdateTaskDto) {
    return this.tasksService.updateTask(
      taskId,
      {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        projectId: dto.projectId || undefined,
        cycleId: dto.cycleId,
        dueDate: dto.dueDate !== undefined ? dto.dueDate : undefined,
        estimate: dto.estimate !== undefined && dto.estimate !== null ? dto.estimate : undefined,
        labels: dto.labels,
      },
      userId,
    );
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

  async updateTaskAssignee(userId: string, taskId: string, assigneeId?: string | null) {
    return this.tasksService.updateTask(taskId, { assigneeId: assigneeId || null }, userId);
  }

  async assignTaskCycle(userId: string, taskId: string, cycleId?: string | null) {
    return this.tasksService.updateTask(taskId, { cycleId: cycleId || null }, userId);
  }

  async deleteTask(userId: string, taskId: string) {
    return this.tasksService.deleteTask(taskId, userId);
  }

  // 7. Subtasks
  async getSubtasks(taskId: string) {
    return this.prisma.task.findMany({
      where: { parentId: taskId, isArchived: false },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createSubtask(userId: string, parentTaskId: string, dto: MobileCreateSubtaskDto) {
    return this.tasksService.createSubTask(parentTaskId, userId, {
      title: dto.title,
      priority: dto.priority || TaskPriority.MEDIUM,
      status: dto.status || TaskStatus.TODO,
      assigneeId: dto.assigneeId,
    });
  }

  // 8. Relations
  async getTaskRelations(taskId: string): Promise<MobileTaskRelationDto[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        sourceRelations: {
          include: {
            targetTask: {
              select: { id: true, identifier: true, title: true, status: true },
            },
          },
        },
        targetRelations: {
          include: {
            sourceTask: {
              select: { id: true, identifier: true, title: true, status: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const relations: MobileTaskRelationDto[] = [];
    for (const r of task.sourceRelations) {
      relations.push({
        id: r.id,
        type: r.type,
        targetTaskId: r.targetTask.id,
        targetIdentifier: r.targetTask.identifier,
        targetTitle: r.targetTask.title,
        targetStatus: r.targetTask.status,
      });
    }
    for (const r of task.targetRelations) {
      const invertedType = r.type === 'BLOCKS' ? 'BLOCKED_BY' : (r.type === 'BLOCKED_BY' ? 'BLOCKS' : r.type);
      relations.push({
        id: r.id,
        type: invertedType,
        targetTaskId: r.sourceTask.id,
        targetIdentifier: r.sourceTask.identifier,
        targetTitle: r.sourceTask.title,
        targetStatus: r.sourceTask.status,
      });
    }
    return relations;
  }

  async createTaskRelation(userId: string, taskId: string, dto: MobileCreateRelationDto) {
    return this.tasksService.addRelation(taskId, userId, {
      targetTaskId: dto.targetTaskId,
      type: dto.type,
    });
  }

  async deleteTaskRelation(userId: string, taskId: string, relationId: string) {
    return this.tasksService.deleteRelation(taskId, relationId, userId);
  }

  // 9. Comments & Reactions
  async getTaskComments(taskId: string): Promise<MobileCommentDto[]> {
    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reactions: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      userId: c.userId,
      user: {
        id: c.user.id,
        name: c.user.name,
        email: c.user.email,
        avatarUrl: c.user.avatarUrl,
      },
      reactions: (c.reactions || []).map((r) => ({
        emoji: r.emoji,
        userId: r.userId,
        userName: r.user.name,
      })),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async addComment(userId: string, taskId: string, content: string) {
    return this.tasksService.addComment(taskId, userId, content);
  }

  async updateComment(userId: string, commentId: string, content: string) {
    return this.tasksService.updateComment(commentId, userId, content);
  }

  async deleteComment(userId: string, commentId: string) {
    return this.tasksService.deleteComment(commentId, userId);
  }

  async toggleTaskReaction(userId: string, taskId: string, emoji: string) {
    return this.tasksService.toggleTaskReaction(taskId, userId, emoji);
  }

  async toggleCommentReaction(userId: string, taskId: string, commentId: string, emoji: string) {
    return this.tasksService.toggleCommentReaction(taskId, commentId, userId, emoji);
  }

  async getTaskActivities(taskId: string): Promise<MobileTaskActivityDto[]> {
    const activities = await this.prisma.taskActivity.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.details || a.type,
      actorName: a.user?.name || 'System',
      actorAvatarUrl: a.user?.avatarUrl || null,
      createdAt: a.createdAt,
    }));
  }

  // 10. Notifications
  async getNotifications(userId: string, unreadOnly?: boolean): Promise<MobileNotificationsResponseDto> {
    const result = await this.inboxService.getNotifications(userId, unreadOnly);
    return {
      notifications: (result.notifications || []) as any,
      unreadCount: result.unreadCount ?? 0,
    };
  }

  async markNotificationRead(userId: string, notificationId: string) {
    return this.inboxService.markAsRead(notificationId, userId);
  }

  async markAllNotificationsRead(userId: string) {
    return this.inboxService.markAllAsRead(userId);
  }

  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    return this.notificationsService.registerDeviceToken(userId, dto);
  }

  async unregisterDeviceToken(userId: string, token: string) {
    return this.notificationsService.unregisterDeviceToken(userId, token);
  }

  async sendTestNotification(userId: string, title?: string, body?: string) {
    await this.notificationsService.sendToUser(userId, {
      title: title || 'Eunomia Mobile Test',
      body: body || 'Firebase Cloud Messaging push notification is active and working!',
      data: {
        type: 'TEST_PUSH',
        timestamp: new Date().toISOString(),
      },
    });
    return { success: true, message: 'Test push notification dispatched' };
  }

  async getNotificationStatus(userId: string) {
    const isReady = this.notificationsService.isReady();
    const tokens = await this.notificationsService.getUserDeviceTokens(userId);
    return {
      serviceReady: isReady,
      registeredDevicesCount: tokens.length,
      deviceTokens: tokens,
    };
  }

  // 11. Trash
  async getTrash(userId: string, workspaceIdParam?: string): Promise<MobileTrashListResponseDto> {
    const workspaceId = await this.getEffectiveWorkspaceId(userId, workspaceIdParam);
    const tasks = await this.prisma.task.findMany({
      where: { workspaceId, isArchived: true },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });

    return {
      items: tasks.map((t) => ({
        id: t.id,
        identifier: t.identifier,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectName: t.project?.name || null,
        assigneeName: t.assignee?.name || null,
        deletedAt: t.deletedAt || t.updatedAt,
      })),
      total: tasks.length,
    };
  }

  async restoreTaskFromTrash(userId: string, taskId: string) {
    return this.tasksService.restoreTask(taskId, userId);
  }

  async permanentDeleteTask(userId: string, taskId: string) {
    return this.tasksService.permanentDeleteTask(taskId, userId);
  }

  // 12. Search
  async search(userId: string, query: MobileSearchQueryDto): Promise<MobileSearchResultDto> {
    const workspaceId = await this.getEffectiveWorkspaceId(userId, query.workspaceId);
    const term = query.q.trim();

    const [rawTasks, rawProjects, rawMembers] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          workspaceId,
          isArchived: false,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { identifier: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        include: {
          project: { select: { id: true, name: true, key: true, color: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          subTasks: { select: { id: true, status: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.project.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { key: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        include: {
          tasks: { select: { id: true, status: true } },
        },
        take: 5,
      }),
      this.prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          user: {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        take: 5,
      }),
    ]);

    return {
      tasks: rawTasks.map((t) => this.mapToCompactTask(t)),
      projects: rawProjects.map((p) => {
        const total = p.tasks.length;
        const done = p.tasks.filter((t) => t.status === TaskStatus.DONE).length;
        return {
          id: p.id,
          name: p.name,
          key: p.key,
          color: p.color,
          description: p.description,
          totalTasks: total,
          completedTasks: done,
          progressPercentage: total > 0 ? Math.round((done / total) * 100) : 0,
          createdAt: p.createdAt,
        };
      }),
      members: rawMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
        },
        status: m.userId === userId ? 'online' : 'offline',
        createdAt: m.createdAt,
      })),
    };
  }

  // 13. Profile & Hover Card
  async getProfile(userId: string): Promise<MobileProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [workspacesCount, assignedTasksCount, completedTasksCount] = await Promise.all([
      this.prisma.workspaceMember.count({ where: { userId } }),
      this.prisma.task.count({ where: { assigneeId: userId, isArchived: false } }),
      this.prisma.task.count({ where: { assigneeId: userId, status: TaskStatus.DONE } }),
    ]);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      stats: {
        workspacesCount,
        assignedTasksCount,
        completedTasksCount,
      },
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: MobileUpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }

  async changePassword(userId: string, dto: MobileChangePasswordDto) {
    return this.authService.updateProfile(userId, {
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }

  async getUserHoverCard(
    currentUserId: string,
    targetUserId: string,
    workspaceIdParam?: string,
  ): Promise<MobileUserHoverCardDto> {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    let workspaceName = 'Tjar';
    let roleOrTitle = 'Tjar';

    const workspaceId = workspaceIdParam || (await this.getEffectiveWorkspaceId(currentUserId).catch(() => undefined));
    if (workspaceId) {
      const ws = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      });
      if (ws) {
        workspaceName = ws.name;
        roleOrTitle = ws.name;
      }

      const membership = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        select: { role: true },
      });
      if (membership) {
        roleOrTitle = membership.role === 'OWNER' ? 'Owner' : (membership.role === 'ADMIN' ? 'Admin' : workspaceName);
      }
    }

    const initials = this.getInitials(targetUser.name);
    const avatarColor = this.getAvatarColor(targetUser.name);
    const handle = targetUser.email
      ? targetUser.email.split('@')[0].toLowerCase()
      : targetUser.name.toLowerCase().replace(/\s+/g, '');
    const isSelf = currentUserId === targetUserId;

    const now = new Date();
    const localTime =
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) +
      ' local time';

    return {
      id: targetUser.id,
      name: targetUser.name,
      handle: `${handle} • ...`,
      avatarUrl: targetUser.avatarUrl,
      initials,
      avatarColor,
      status: isSelf ? 'online' : 'offline',
      localTime,
      roleOrTitle,
      workspaceName,
    };
  }

  // 14. Admin Only: Task Performance Indicators
  async getAdminPerformance(
    userId: string,
    workspaceIdParam?: string,
    period: string = 'all',
  ): Promise<MobileAdminPerformanceResponseDto> {
    const workspaceId = await this.getEffectiveWorkspaceId(userId, workspaceIdParam);

    // Strict Admin Authorization Check (Owner or Admin only)
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found or user is not a member');
    }

    if (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException(
        'Admin access only. You must be an owner or administrator of this workspace to view performance indicators.',
      );
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [membersRaw, tasksRaw, projectsRaw, cyclesRaw] = await Promise.all([
      this.prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.task.findMany({
        where: { workspaceId, isArchived: false },
        select: {
          id: true,
          identifier: true,
          title: true,
          status: true,
          priority: true,
          assigneeId: true,
          projectId: true,
          cycleId: true,
          createdAt: true,
          updatedAt: true,
          project: { select: { id: true, name: true, key: true, color: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.project.findMany({
        where: { workspaceId },
        select: { id: true, name: true, key: true, color: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cycle.findMany({
        where: { workspaceId },
        select: { id: true, number: true, name: true, status: true },
        orderBy: { number: 'desc' },
        take: 5,
      }),
    ]);

    let filteredTasks = tasksRaw;
    if (period === 'this_week') {
      filteredTasks = tasksRaw.filter(
        (t) => t.createdAt >= oneWeekAgo || (t.status === TaskStatus.DONE && t.updatedAt >= oneWeekAgo),
      );
    } else if (period === 'this_month') {
      filteredTasks = tasksRaw.filter(
        (t) => t.createdAt >= oneMonthAgo || (t.status === TaskStatus.DONE && t.updatedAt >= oneMonthAgo),
      );
    }

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter((t) => t.status === TaskStatus.DONE).length;
    const inProgressTasks = filteredTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const pendingTasks = filteredTasks.filter(
      (t) => t.status === TaskStatus.TODO || t.status === TaskStatus.BACKLOG,
    ).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;

    const completedThisWeek = tasksRaw.filter(
      (t) => t.status === TaskStatus.DONE && t.updatedAt >= oneWeekAgo,
    ).length;
    const completedThisMonth = tasksRaw.filter(
      (t) => t.status === TaskStatus.DONE && t.updatedAt >= oneMonthAgo,
    ).length;

    // Member performance leaderboard based on finished/done tasks
    const memberStats = membersRaw.map((m) => {
      const userTasks = filteredTasks.filter((t) => t.assigneeId === m.userId);
      const mAssigned = userTasks.length;
      const mDone = userTasks.filter((t) => t.status === TaskStatus.DONE).length;
      const mInProgress = userTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
      const mRate = mAssigned > 0 ? Math.round((mDone / mAssigned) * 100) : 0;

      const mWeekDone = tasksRaw.filter(
        (t) => t.assigneeId === m.userId && t.status === TaskStatus.DONE && t.updatedAt >= oneWeekAgo,
      ).length;
      const mMonthDone = tasksRaw.filter(
        (t) => t.assigneeId === m.userId && t.status === TaskStatus.DONE && t.updatedAt >= oneMonthAgo,
      ).length;

      let performanceGrade: 'EXCELLENT' | 'HIGH' | 'ON_TRACK' | 'NEEDS_FOCUS' = 'NEEDS_FOCUS';
      if (mRate >= 80 && mDone >= 3) {
        performanceGrade = 'EXCELLENT';
      } else if (mRate >= 60 || mDone >= 2) {
        performanceGrade = 'HIGH';
      } else if (mDone >= 1 || mInProgress >= 1) {
        performanceGrade = 'ON_TRACK';
      }

      return {
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        assignedTasks: mAssigned,
        completedTasks: mDone,
        inProgressTasks: mInProgress,
        completionRate: mRate,
        completedThisWeek: mWeekDone,
        completedThisMonth: mMonthDone,
        performanceGrade,
      };
    });

    memberStats.sort(
      (a, b) => b.completedTasks - a.completedTasks || b.completionRate - a.completionRate,
    );

    const membersWithRank = memberStats.map((m, index) => ({
      ...m,
      rank: index + 1,
    }));

    const activeMembersCount = memberStats.filter(
      (m) => m.assignedTasks > 0 || m.completedTasks > 0,
    ).length;
    const avgTasksPerMember =
      membersRaw.length > 0 ? Math.round((completedTasks / membersRaw.length) * 10) / 10 : 0;

    const projectStats = projectsRaw.map((p) => {
      const pTasks = filteredTasks.filter((t) => t.projectId === p.id);
      const pTotal = pTasks.length;
      const pDone = pTasks.filter((t) => t.status === TaskStatus.DONE).length;
      const pRate = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

      return {
        projectId: p.id,
        name: p.name,
        key: p.key,
        color: p.color,
        totalTasks: pTotal,
        completedTasks: pDone,
        completionRate: pRate,
      };
    });

    const cycleStats = cyclesRaw.map((c) => {
      const cTasks = tasksRaw.filter((t) => t.cycleId === c.id);
      const cTotal = cTasks.length;
      const cDone = cTasks.filter((t) => t.status === TaskStatus.DONE).length;
      const cRate = cTotal > 0 ? Math.round((cDone / cTotal) * 100) : 0;

      return {
        cycleId: c.id,
        number: c.number,
        name: c.name || `Cycle ${c.number}`,
        status: c.status,
        totalTasks: cTotal,
        completedTasks: cDone,
        completionRate: cRate,
      };
    });

    const recentDoneTasks = tasksRaw
      .filter((t) => t.status === TaskStatus.DONE)
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        identifier: t.identifier,
        title: t.title,
        projectName: t.project?.name || 'General',
        assigneeName: t.assignee?.name || null,
        assigneeAvatarUrl: t.assignee?.avatarUrl || null,
        completedAt: t.updatedAt,
      }));

    return {
      workspaceId: membership.workspace.id,
      workspaceName: membership.workspace.name,
      currentUserRole: membership.role,
      period,
      summary: {
        totalTasks,
        completedTasks,
        completionRate,
        inProgressTasks,
        pendingTasks,
        completedThisWeek,
        completedThisMonth,
        totalMembers: membersRaw.length,
        activeMembers: activeMembersCount,
        avgTasksPerMember,
      },
      members: membersWithRank,
      projects: projectStats,
      cycles: cycleStats,
      recentDoneTasks,
    };
  }
}
