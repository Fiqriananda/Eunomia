import {
  Task,
  TaskPriority,
  TaskStatus,
  Workspace,
  WorkspaceMember,
  WorkflowSection,
  Project,
  User,
  Attachment,
  TaskComment,
  TaskActivity,
  InboxNotification,
  Cycle,
  TaskReaction,
  CommentReaction,
  WorkspaceInvitation,
  Division,
  DivisionMember,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('linear_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'An error occurred during request');
    }

    return res.json();
  }

  // Auth
  auth = {
    login: (body: { email: string; password: string }) =>
      this.request<{
        accessToken: string;
        user: User;
        workspace: Workspace;
        defaultProject: Project;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    register: (body: { email: string; password: string; name: string }) =>
      this.request<{
        accessToken: string;
        user: User;
        workspace: Workspace;
        defaultProject: Project;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    getMe: () => this.request<User & { workspaces: Array<{ workspace: Workspace }> }>('/auth/me'),

    updateProfile: (data: {
      name?: string;
      avatarUrl?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    }) =>
      this.request<User>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // Workspaces
  workspaces = {
    getAll: () => this.request<Workspace[]>('/workspaces'),
    getById: (id: string) => this.request<Workspace>(`/workspaces/${id}`),
    create: (data: { name: string }) =>
      this.request<Workspace>('/workspaces', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: { name?: string; cyclesEnabled?: boolean; logoUrl?: string | null },
    ) =>
      this.request<Workspace>(`/workspaces/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getMembers: (workspaceId: string) =>
      this.request<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
    inviteMember: (workspaceId: string, data: { email: string; name?: string; role?: string }) =>
      this.request<WorkspaceMember>(`/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateMemberRole: (workspaceId: string, memberId: string, role: string) =>
      this.request<WorkspaceMember>(`/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    removeMember: (workspaceId: string, memberId: string) =>
      this.request<{ success: boolean }>(`/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      }),
    getSections: (workspaceId: string) =>
      this.request<WorkflowSection[]>(`/workspaces/${workspaceId}/sections`),
    createSection: (
      workspaceId: string,
      data: { name: string; key?: string; color?: string; category?: TaskStatus },
    ) =>
      this.request<WorkflowSection>(`/workspaces/${workspaceId}/sections`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteSection: (workspaceId: string, sectionId: string) =>
      this.request<{ success: boolean }>(`/workspaces/${workspaceId}/sections/${sectionId}`, {
        method: 'DELETE',
      }),
    updateColumnOrder: (workspaceId: string, columnOrder: string[]) =>
      this.request<Workspace>(`/workspaces/${workspaceId}/columns`, {
        method: 'PATCH',
        body: JSON.stringify({ columnOrder }),
      }),
    getInvitations: (workspaceId: string) =>
      this.request<WorkspaceInvitation[]>(`/workspaces/${workspaceId}/invitations`),
    cancelInvitation: (workspaceId: string, invitationId: string) =>
      this.request<{ success: boolean }>(`/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: 'DELETE',
      }),
    getDivisions: (workspaceId: string) =>
      this.request<Division[]>(`/workspaces/${workspaceId}/divisions`),
    createDivision: (workspaceId: string, data: { name: string; slug?: string; description?: string; isTechnical?: boolean }) =>
      this.request<Division>(`/workspaces/${workspaceId}/divisions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateDivision: (workspaceId: string, divisionId: string, data: { name?: string; slug?: string; description?: string; isTechnical?: boolean }) =>
      this.request<Division>(`/workspaces/${workspaceId}/divisions/${divisionId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteDivision: (workspaceId: string, divisionId: string) =>
      this.request<{ success: boolean }>(`/workspaces/${workspaceId}/divisions/${divisionId}`, {
        method: 'DELETE',
      }),
    addDivisionMember: (workspaceId: string, divisionId: string, userId: string, role?: string) =>
      this.request<DivisionMember>(`/workspaces/${workspaceId}/divisions/${divisionId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId, role }),
      }),
    removeDivisionMember: (workspaceId: string, divisionId: string, userId: string) =>
      this.request<{ success: boolean }>(`/workspaces/${workspaceId}/divisions/${divisionId}/members/${userId}`, {
        method: 'DELETE',
      }),
  };

  // Projects
  projects = {
    getByWorkspace: (workspaceId: string) =>
      this.request<Project[]>(`/projects?workspaceId=${workspaceId}`),
    create: (data: { workspaceId: string; name: string; key: string; description?: string; color?: string }) =>
      this.request<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string; key?: string; description?: string; color?: string }) =>
      this.request<Project>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // Cycles
  cycles = {
    getAll: (workspaceId: string) => this.request<Cycle[]>(`/cycles?workspaceId=${workspaceId}`),
    getActive: (workspaceId: string) =>
      this.request<Cycle | null>(`/cycles/active?workspaceId=${workspaceId}`),
    getById: (id: string) => this.request<Cycle>(`/cycles/${id}`),
    create: (data: {
      workspaceId: string;
      name: string;
      number?: number;
      startDate: string;
      endDate: string;
      status?: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
    }) =>
      this.request<Cycle>('/cycles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: {
        name?: string;
        startDate?: string;
        endDate?: string;
        status?: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
      },
    ) =>
      this.request<Cycle>(`/cycles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    rollover: (id: string, targetCycleId?: string) =>
      this.request<{ message: string; rolledOverCount: number }>(`/cycles/${id}/rollover`, {
        method: 'POST',
        body: JSON.stringify({ targetCycleId }),
      }),
  };

  // Tasks
  tasks = {
    getAll: (params: {
      workspaceId: string;
      projectId?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      search?: string;
      parentId?: string;
      cycleId?: string;
      archived?: boolean | string;
      requesterDivisionId?: string;
      assignedDivisionId?: string;
      triageStatus?: string;
      includePendingTriage?: boolean | string;
    }) => {
      const query = new URLSearchParams();
      query.append('workspaceId', params.workspaceId);
      if (params.projectId) query.append('projectId', params.projectId);
      if (params.status) query.append('status', params.status);
      if (params.priority) query.append('priority', params.priority);
      if (params.assigneeId) query.append('assigneeId', params.assigneeId);
      if (params.search) query.append('search', params.search);
      if (params.parentId !== undefined) query.append('parentId', params.parentId);
      if (params.cycleId) query.append('cycleId', params.cycleId);
      if (params.archived !== undefined) query.append('archived', String(params.archived));
      if (params.requesterDivisionId) query.append('requesterDivisionId', params.requesterDivisionId);
      if (params.assignedDivisionId) query.append('assignedDivisionId', params.assignedDivisionId);
      if (params.triageStatus) query.append('triageStatus', params.triageStatus);
      if (params.includePendingTriage !== undefined) query.append('includePendingTriage', String(params.includePendingTriage));
      return this.request<Task[]>(`/tasks?${query.toString()}`);
    },

    getById: (id: string) => this.request<Task>(`/tasks/${id}`),

    createIntake: (data: {
      workspaceId: string;
      title: string;
      requesterDivisionId?: string;
      customDivisionName?: string;
      description: string;
      urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
      targetDeadline?: string;
      assetLinks?: string;
      businessObjective?: string;
      targetAudience?: string;
    }) =>
      this.request<Task>('/tasks/intake', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getTriageRequests: (workspaceId: string) =>
      this.request<Task[]>(`/tasks/triage?workspaceId=${workspaceId}`),

    updateTriageStatus: (
      taskId: string,
      data: {
        action: 'APPROVE' | 'REJECT' | 'RESUBMIT';
        priority?: TaskPriority;
        estimate?: number;
        cycleId?: string | null;
        status?: TaskStatus;
        comment?: string;
      },
    ) =>
      this.request<Task>(`/tasks/${taskId}/triage`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    create: (data: {
      workspaceId: string;
      projectId: string;
      title: string;
      description?: string;
      status?: TaskStatus;
      customStatus?: string | null;
      priority?: TaskPriority;
      assigneeId?: string;
      dueDate?: string;
      labels?: string[];
      parentId?: string | null;
      cycleId?: string | null;
      estimate?: number;
    }) =>
      this.request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (
      id: string,
      data: {
        title?: string;
        description?: string | null;
        status?: TaskStatus;
        customStatus?: string | null;
        priority?: TaskPriority;
        assigneeId?: string | null;
        dueDate?: string | null;
        labels?: string[];
        projectId?: string;
        identifier?: string;
        parentId?: string | null;
        cycleId?: string | null;
        estimate?: number;
        isArchived?: boolean;
      },
    ) =>
      this.request<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    restore: (id: string) =>
      this.request<Task>(`/tasks/${id}/restore`, {
        method: 'PATCH',
      }),

    permanentDelete: (id: string) =>
      this.request<{ success: boolean }>(`/tasks/${id}/permanent`, {
        method: 'DELETE',
      }),

    createSubTask: (
      parentId: string,
      data: {
        title: string;
        description?: string;
        status?: TaskStatus;
        customStatus?: string | null;
        priority?: TaskPriority;
        assigneeId?: string;
        dueDate?: string;
        labels?: string[];
        projectId?: string;
        cycleId?: string | null;
        estimate?: number;
      },
    ) =>
      this.request<Task>(`/tasks/${parentId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    linkSubTask: (parentId: string, subTaskId: string) =>
      this.request<Task>(`/tasks/${parentId}/link-subtask`, {
        method: 'POST',
        body: JSON.stringify({ subTaskId }),
      }),

    unlinkSubTask: (parentId: string, subTaskId: string) =>
      this.request<Task>(`/tasks/${parentId}/subtasks/${subTaskId}`, {
        method: 'DELETE',
      }),

    addRelation: (taskId: string, data: { targetTaskId: string; type?: string }) =>
      this.request<Task>(`/tasks/${taskId}/relations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteRelation: (taskId: string, relationId: string) =>
      this.request<Task>(`/tasks/${taskId}/relations/${relationId}`, {
        method: 'DELETE',
      }),

    move: (
      id: string,
      data: {
        status?: TaskStatus;
        customStatus?: string | null;
        priority?: TaskPriority;
        targetOrder?: number;
      },
    ) =>
      this.request<Task>(`/tasks/${id}/move`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request<{ success: boolean }>(`/tasks/${id}`, {
        method: 'DELETE',
      }),

    addComment: (taskId: string, content: string, parentId?: string) =>
      this.request<TaskComment>(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parentId }),
      }),

    subscribe: (taskId: string) =>
      this.request<{ success: boolean; subscription: any }>(`/tasks/${taskId}/subscribe`, {
        method: 'POST',
      }),

    unsubscribe: (taskId: string) =>
      this.request<{ success: boolean }>(`/tasks/${taskId}/subscribe`, {
        method: 'DELETE',
      }),

    getSubscribers: (taskId: string) =>
      this.request<any[]>(`/tasks/${taskId}/subscribers`, {
        method: 'GET',
      }),

    updateComment: (taskId: string, commentId: string, content: string) =>
      this.request<TaskComment>(`/tasks/${taskId}/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),

    deleteComment: (taskId: string, commentId: string) =>
      this.request<{ success: boolean }>(`/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE',
      }),

    toggleTaskReaction: (taskId: string, emoji: string) =>
      this.request<{
        action: 'added' | 'removed';
        reaction?: TaskReaction;
        taskId: string;
        userId: string;
      }>(`/tasks/${taskId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),

    toggleCommentReaction: (taskId: string, commentId: string, emoji: string) =>
      this.request<{
        action: 'added' | 'removed';
        reaction?: CommentReaction;
        commentId: string;
        taskId: string;
        userId: string;
      }>(`/tasks/${taskId}/comments/${commentId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),

    logActivity: (
      taskId: string,
      data: { type: string; details?: string; fromValue?: string; toValue?: string },
    ) =>
      this.request<TaskActivity>(`/tasks/${taskId}/activities`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Uploads
  uploads = {
    upload: async (file: File, taskId?: string): Promise<Attachment> => {
      const formData = new FormData();
      formData.append('file', file);
      const token = typeof window !== 'undefined' ? localStorage.getItem('linear_token') : null;

      const url = new URL(`${API_BASE_URL}/uploads`);
      if (taskId) url.searchParams.append('taskId', taskId);

      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'File upload failed');
      }

      return res.json();
    },

    delete: (id: string) =>
      this.request<Attachment>(`/uploads/${id}`, {
        method: 'DELETE',
      }),
  };

  // Inbox Notifications
  inbox = {
    get: (unreadOnly?: boolean) =>
      this.request<{ notifications: InboxNotification[]; unreadCount: number }>(
        `/inbox${unreadOnly ? '?unreadOnly=true' : ''}`,
      ),

    markAsRead: (id: string) =>
      this.request<InboxNotification>(`/inbox/${id}/read`, {
        method: 'PATCH',
      }),

    markAllAsRead: () =>
      this.request<{ success: boolean }>('/inbox/read-all', {
        method: 'POST',
      }),

    delete: (id: string) =>
      this.request<{ success: boolean }>(`/inbox/${id}`, {
        method: 'DELETE',
      }),
  };

  // Invitations
  invitations = {
    getByToken: (token: string) =>
      this.request<WorkspaceInvitation>(`/workspaces/invitations/${token}`),

    accept: (tokenOrId: string) =>
      this.request<{ success: boolean; message: string; workspace: Workspace }>(
        `/workspaces/invitations/${tokenOrId}/accept`,
        { method: 'POST' },
      ),

    acceptPublic: (token: string, data?: { name?: string; password?: string }) =>
      this.request<{
        success: boolean;
        message: string;
        accessToken: string;
        user: User;
        workspace: Workspace;
      }>(`/workspaces/invitations/${token}/accept-public`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),

    decline: (tokenOrId: string) =>
      this.request<{ success: boolean; message: string }>(
        `/workspaces/invitations/${tokenOrId}/decline`,
        { method: 'POST' },
      ),
  };

  // Admin Performance & Analytics
  admin = {
    getPerformance: (workspaceId?: string, period: string = 'all') => {
      const q = new URLSearchParams({ period });
      if (workspaceId) q.append('workspaceId', workspaceId);
      return this.request<{
        workspaceId: string;
        workspaceName: string;
        currentUserRole: string;
        period: string;
        summary: {
          totalTasks: number;
          completedTasks: number;
          completionRate: number;
          inProgressTasks: number;
          pendingTasks: number;
          completedThisWeek: number;
          completedThisMonth: number;
          totalMembers: number;
          activeMembers: number;
          avgTasksPerMember: number;
        };
        members: Array<{
          userId: string;
          name: string;
          email: string;
          avatarUrl?: string | null;
          role: string;
          assignedTasks: number;
          completedTasks: number;
          inProgressTasks: number;
          completionRate: number;
          completedThisWeek: number;
          completedThisMonth: number;
          rank: number;
          performanceGrade: 'EXCELLENT' | 'HIGH' | 'ON_TRACK' | 'NEEDS_FOCUS';
        }>;
        projects: Array<{
          projectId: string;
          name: string;
          key: string;
          color?: string | null;
          totalTasks: number;
          completedTasks: number;
          completionRate: number;
        }>;
        cycles: Array<{
          cycleId: string;
          name: string;
          number: number;
          status: string;
          totalTasks: number;
          completedTasks: number;
          completionRate: number;
        }>;
        recentDoneTasks: Array<{
          id: string;
          identifier: string;
          title: string;
          projectName: string;
          assigneeName?: string | null;
          assigneeAvatarUrl?: string | null;
          completedAt: string;
        }>;
      }>(`/mobile/admin/performance?${q.toString()}`);
    },
  };
}

export const api = new ApiClient();
