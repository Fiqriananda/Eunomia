export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';

export type TaskPriority = 'NO_PRIORITY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'STAKEHOLDER';

export type TriageStatus = 'INBOX_PENDING' | 'APPROVED_BACKLOG' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  workspaceId: string;
  userId: string;
  user: User;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  color?: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  columnOrder?: string[];
  cyclesEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  projects?: Project[];
  members?: WorkspaceMember[];
  divisions?: Division[];
  role?: WorkspaceRole;
}

export interface TaskReaction {
  id: string;
  emoji: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface CommentReaction {
  id: string;
  emoji: string;
  commentId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: User;
  parentId?: string | null;
  parent?: {
    id: string;
    content: string;
    user: User;
  } | null;
  replies?: TaskComment[];
  reactions?: CommentReaction[];
  createdAt: string;
  updatedAt: string;
}

export type Comment = TaskComment;

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  taskId?: string | null;
  uploaderId: string;
  createdAt: string;
}

export interface WorkflowSection {
  id: string;
  name: string;
  key: string;
  color?: string;
  order?: number;
  category?: TaskStatus;
  workspaceId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskActivity {
  id: string;
  type: string;
  fromValue?: string | null;
  toValue?: string | null;
  details?: string | null;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export type TaskRelationType = 'RELATED' | 'BLOCKS' | 'BLOCKED_BY' | 'DUPLICATE';

export interface TaskRelation {
  id: string;
  type: TaskRelationType;
  sourceTaskId: string;
  targetTaskId: string;
  sourceTask?: Task;
  targetTask?: Task;
  createdAt: string;
}

export interface Cycle {
  id: string;
  number: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    remainingTasks: number;
    totalPoints: number;
    completedPoints: number;
    remainingPoints: number;
    velocityPercentage: number;
  };
}

export interface Task {
  id: string;
  identifier: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  customStatus?: string | null;
  priority: TaskPriority;
  order: number;
  dueDate?: string | null;
  labels: string[];
  projectId: string;
  workspaceId: string;
  creatorId: string;
  assigneeId?: string | null;
  cycleId?: string | null;
  estimate?: number;
  isArchived?: boolean;
  deletedAt?: string | null;
  project?: Project;
  cycle?: Cycle | null;
  creator?: User;
  assignee?: User | null;
  requesterDivisionId?: string | null;
  requesterDivision?: Division | null;
  assignedDivisionId?: string | null;
  assignedDivision?: Division | null;
  triageStatus?: TriageStatus | null;
  externalMetadata?: ExternalMetadata | null;
  parentId?: string | null;
  parent?: {
    id: string;
    identifier: string;
    title: string;
    status: TaskStatus;
    customStatus?: string | null;
    priority?: TaskPriority;
  } | null;
  subTasks?: Task[];
  sourceRelations?: {
    id: string;
    type: TaskRelationType;
    sourceTaskId: string;
    targetTaskId: string;
    targetTask: Task;
  }[];
  targetRelations?: {
    id: string;
    type: TaskRelationType;
    sourceTaskId: string;
    targetTaskId: string;
    sourceTask: Task;
  }[];
  attachments?: Attachment[];
  comments?: TaskComment[];
  reactions?: TaskReaction[];
  activities?: TaskActivity[];
  subscribers?: TaskSubscription[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubscription {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  invitedById: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  invitedBy?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface InboxNotification {
  id: string;
  type: 'ASSIGNED' | 'MENTIONED' | 'WORKSPACE_INVITATION' | 'COMMENT_REPLY' | 'TASK_UPDATE';
  title: string;
  body?: string | null;
  isRead: boolean;
  readAt?: string | null;
  userId: string;
  actorId: string;
  taskId?: string | null;
  workspaceId?: string | null;
  invitationId?: string | null;
  createdAt: string;
  task?: {
    id: string;
    identifier: string;
    title: string;
    status: TaskStatus;
    priority?: TaskPriority;
    project?: {
      id: string;
      name: string;
      key: string;
      color?: string;
    };
  };
  actor?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
  invitation?: {
    id: string;
    token: string;
    role: WorkspaceRole;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  };
}

export interface ExternalMetadata {
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  targetDeadline?: string | null;
  assetLinks?: string | string[] | null;
  businessObjective?: string | null;
  targetAudience?: string | null;
  submittedAt?: string;
  [key: string]: any;
}

export interface DivisionMember {
  id: string;
  divisionId: string;
  userId: string;
  user: User;
  role?: string;
  createdAt?: string;
}

export interface Division {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isTechnical: boolean;
  workspaceId: string;
  members?: DivisionMember[];
  _count?: {
    requestedTasks?: number;
    assignedTasks?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

