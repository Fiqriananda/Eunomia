'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { AuthScreen } from '../../../components/auth/AuthScreen';
import { Task, TaskPriority, TaskStatus, WorkspaceMember, TaskComment, Project, WorkflowSection, TaskActivity, Cycle, TaskReaction, TaskSubscription } from '../../../types';
import { PriorityIcon, PRIORITY_CONFIG } from '../../../components/linear/PriorityIcon';
import { StatusIcon, STATUS_CONFIG } from '../../../components/linear/StatusIcon';
import { FileUploader } from '../../../components/linear/FileUploader';
import { SubIssuesSection } from '../../../components/linear/SubIssuesSection';
import { RelatedIssuesSection } from '../../../components/linear/RelatedIssuesSection';
import {
  X,
  Trash2,
  Calendar,
  User as UserIcon,
  Tag,
  Check,
  Copy,
  Star,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Paperclip,
  MessageSquare,
  Send,
  FolderKanban,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Search,
  GitBranch,
  AtSign,
  Edit3,
  Hash,
  GitFork,
  Link as LinkIcon,
  RotateCw,
  RotateCcw,
  Target,
  Image as ImageIcon,
  ExternalLink,
  Pencil,
  Link2,
  Smile,
  Bell,
  BellRing,
  CornerDownRight,
  ArrowUp,
  Building2,
  History,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { MarkdownRenderer, resolveMediaUrl } from '../../../components/ui/MarkdownRenderer';
import { LinearRichEditor } from '../../../components/linear/LinearRichEditor';
import { ReactionsBar } from '../../../components/linear/ReactionsBar';
import { ProfileHoverCard } from '../../../components/ui/ProfileHoverCard';
import { UserAvatar } from '../../../components/ui/UserAvatar';

const PRIORITIES: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY'];
const STATUSES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'];

const PRESET_LABEL_COLORS: Record<string, string> = {
  Feature: '#a855f7',
  Bug: '#ef4444',
  Improvement: '#3b82f6',
  Critical: '#f43f5e',
  Design: '#f97316',
  Frontend: '#0ea5e9',
  Backend: '#10b981',
  Performance: '#14b8a6',
  Storage: '#6366f1',
  Research: '#8b5cf6',
  Documentation: '#84cc16',
  Security: '#e11d48',
};

export const getLabelColor = (name: string) => {
  if (PRESET_LABEL_COLORS[name]) return PRESET_LABEL_COLORS[name];
  const palette = ['#a855f7', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

export const renderCommentContentWithMentions = (content: string, membersList: WorkspaceMember[]) => {
  return <MarkdownRenderer content={content} membersList={membersList} />;
};

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.max(0, Math.floor(diff / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function IssueDetailContent() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const { user, workspace, projects, loading: authLoading } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>(workspace?.members || []);

  useEffect(() => {
    if (workspace?.members && workspace.members.length > 0 && members.length === 0) {
      setMembers(workspace.members);
    }
  }, [workspace?.members, members.length]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [customStatus, setCustomStatus] = useState<string | null>(null);
  const [sections, setSections] = useState<WorkflowSection[]>([]);
  const [priority, setPriority] = useState<TaskPriority>('NO_PRIORITY');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [labels, setLabels] = useState<string[]>([]);
  const [labelSearch, setLabelSearch] = useState('');

  // Collect all unique labels ever used in this workspace plus standard preset labels
  const allWorkspaceLabels = useMemo(() => {
    const defaultLabels = [
      'Feature',
      'Bug',
      'Improvement',
      'Critical',
      'Design',
      'Frontend',
      'Backend',
      'Performance',
      'Research',
      'Storage',
    ];
    const set = new Set<string>(defaultLabels);
    allTasks.forEach((t) => {
      (t.labels || []).forEach((lbl) => set.add(lbl));
    });
    labels.forEach((lbl) => set.add(lbl));
    return Array.from(set);
  }, [allTasks, labels]);

  const filteredLabels = useMemo(() => {
    if (!labelSearch.trim()) return allWorkspaceLabels;
    const q = labelSearch.toLowerCase();
    return allWorkspaceLabels.filter((lbl) => lbl.toLowerCase().includes(q));
  }, [allWorkspaceLabels, labelSearch]);

  const handleToggleLabel = (lbl: string) => {
    const updated = labels.includes(lbl) ? labels.filter((l) => l !== lbl) : [...labels, lbl];
    setLabels(updated);
    triggerSave({ labels: updated });
  };

  const handleCreateLabel = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!labels.includes(trimmed)) {
      const updated = [...labels, trimmed];
      setLabels(updated);
      triggerSave({ labels: updated });
    }
    setLabelSearch('');
  };

  // Auto-save feedback state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Socket & Real-time Collaboration
  const { socket } = useSocket();

  // Cycles & Estimates
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<number>(1);
  const [descPreview, setDescPreview] = useState(false);

  // Comments & Activities
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  // Task Subscribers & Comment Reply State
  const [subscribers, setSubscribers] = useState<TaskSubscription[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    authorName: string;
    contentPreview: string;
  } | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [submittingReplyMap, setSubmittingReplyMap] = useState<Record<string, boolean>>({});
  const [replyUploadingMap, setReplyUploadingMap] = useState<Record<string, boolean>>({});
  const replyInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const replyFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Reply Mention Tagging State
  const [replyMentionParentId, setReplyMentionParentId] = useState<string | null>(null);
  const [replyMentionQuery, setReplyMentionQuery] = useState<string | null>(null);
  const [replyMentionIndex, setReplyMentionIndex] = useState(0);
  const [replyMentionCursorPos, setReplyMentionCursorPos] = useState(-1);

  // UI state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Mention Tagging State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(0);
  const [mentionCursorPos, setMentionCursorPos] = useState<number>(-1);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mainCommentFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Comment Mention Tagging State
  const editCommentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [editingMentionQuery, setEditingMentionQuery] = useState<string | null>(null);
  const [editingMentionIndex, setEditingMentionIndex] = useState<number>(0);
  const [editingMentionCursorPos, setEditingMentionCursorPos] = useState<number>(-1);

  // Task Reactions State
  const [taskReactions, setTaskReactions] = useState<TaskReaction[]>([]);

  // Prefix Modal State
  const [showPrefixModal, setShowPrefixModal] = useState(false);
  const [newPrefix, setNewPrefix] = useState('');
  const [updatingPrefix, setUpdatingPrefix] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const subIssuesRef = useRef<HTMLDivElement>(null);
  const relatedIssuesRef = useRef<HTMLDivElement>(null);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [isUploadingDescImage, setIsUploadingDescImage] = useState(false);
  const [isUploadingCommentImage, setIsUploadingCommentImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Real-time typing & auto-save timer refs
  const taskRef = useRef<Task | null>(task);
  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const descTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocalTitleTypeRef = useRef<number>(0);
  const lastLocalDescTypeRef = useRef<number>(0);
  const [typingIndicator, setTypingIndicator] = useState<{
    userName: string;
    field: 'title' | 'description';
  } | null>(null);

  // Ensure workspace room and task room are joined for real-time collaboration
  useEffect(() => {
    if (!socket || !taskId) return;
    socket.emit('join_task', { taskId });
    const wsId = task?.workspaceId || workspace?.id;
    if (wsId) {
      socket.emit('join_workspace', { workspaceId: wsId });
    }
    return () => {
      socket.emit('leave_task', { taskId });
    };
  }, [socket, taskId, task?.workspaceId, workspace?.id]);

  // Auto-resize description textarea
  const adjustTextareaHeight = () => {
    if (descTextareaRef.current) {
      descTextareaRef.current.style.height = 'auto';
      descTextareaRef.current.style.height = `${Math.max(160, descTextareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [description]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.property-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Real-time WebSockets listeners for live collaboration
  useEffect(() => {
    if (!socket || !taskId) return;

    const handleCommentCreated = (data: { taskId: string; comment: TaskComment }) => {
      if (data.taskId === taskId) {
        setComments((prev) => {
          if (prev.some((c) => c.id === data.comment.id)) return prev;

          // Reconcile optimistic temp comment if one exists matching this user and content
          const tempIndex = prev.findIndex(
            (c) =>
              c.id.startsWith('temp-') &&
              (c.userId === data.comment.userId || c.userId === 'me') &&
              c.content === data.comment.content
          );

          if (tempIndex !== -1) {
            const next = [...prev];
            next[tempIndex] = data.comment;
            return next;
          }

          return [...prev, data.comment];
        });
      }
    };

    const handleCommentUpdated = (data: { taskId: string; comment: TaskComment }) => {
      if (data.taskId === taskId) {
        setComments((prev) =>
          prev.map((c) => (c.id === data.comment.id ? data.comment : c)),
        );
      }
    };

    const handleCommentDeleted = (data: { taskId: string; commentId: string }) => {
      if (data.taskId === taskId) {
        setComments((prev) => prev.filter((c) => c.id !== data.commentId));
      }
    };

    const handleTaskTyping = (data: {
      workspaceId?: string;
      taskId: string;
      field: 'title' | 'description';
      value: string;
      userId: string;
      userName: string;
      senderSocketId?: string;
    }) => {
      if (data.taskId !== taskId) return;
      if (data.senderSocketId && socket && data.senderSocketId === socket.id) return;

      const isLocalTypingTitle = Date.now() - lastLocalTitleTypeRef.current < 700;
      const isLocalTypingDesc = Date.now() - lastLocalDescTypeRef.current < 700;

      if (data.field === 'title') {
        if (!isLocalTypingTitle) {
          setTitle(data.value);
        }
      } else if (data.field === 'description') {
        if (!isLocalTypingDesc) {
          setDescription(data.value);
        }
      }

      setTypingIndicator({
        userName: data.userName || 'A teammate',
        field: data.field,
      });

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTypingIndicator(null);
      }, 1500);
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      if (updatedTask.id === taskId) {
        setTask((prev) => (prev ? { ...prev, ...updatedTask } : updatedTask));
        const isLocalTypingTitle = Date.now() - lastLocalTitleTypeRef.current < 700;
        const isLocalTypingDesc = Date.now() - lastLocalDescTypeRef.current < 700;
        if (!isLocalTypingTitle) {
          setTitle(updatedTask.title);
        }
        if (!isLocalTypingDesc) {
          setDescription(updatedTask.description || '');
        }
        setStatus(updatedTask.status);
        setCustomStatus(updatedTask.customStatus || null);
        setPriority(updatedTask.priority);
        setAssigneeId(updatedTask.assigneeId || null);
        if (updatedTask.cycleId !== undefined) setCycleId(updatedTask.cycleId || null);
        if (updatedTask.estimate !== undefined) setEstimate(updatedTask.estimate || 1);
        if (updatedTask.dueDate !== undefined) {
          setDueDate(updatedTask.dueDate ? new Date(updatedTask.dueDate).toISOString().split('T')[0] : '');
        }
        if (updatedTask.labels) {
          setLabels(updatedTask.labels);
        }
        if (updatedTask.activities) {
          setActivities(updatedTask.activities);
        }
        if (updatedTask.subscribers) {
          setSubscribers(updatedTask.subscribers);
        }
      }
    };

    const handleTaskMoved = (data: { taskId: string; task?: Task; status?: TaskStatus; customStatus?: string | null; priority?: TaskPriority }) => {
      if (data.taskId === taskId) {
        if (data.task) {
          setTask((prev) => (prev ? { ...prev, ...data.task } : data.task!));
          if (data.task.title && document.activeElement !== titleInputRef.current) {
            setTitle(data.task.title);
          }
          if (data.task.description !== undefined && document.activeElement !== descTextareaRef.current) {
            setDescription(data.task.description || '');
          }
        }
        if (data.status) setStatus(data.status);
        if (data.customStatus !== undefined) setCustomStatus(data.customStatus);
        if (data.priority) setPriority(data.priority);
      }
    };

    const handleTaskReactionToggled = (data: {
      taskId: string;
      emoji: string;
      userId: string;
      user?: any;
      action: 'added' | 'removed';
    }) => {
      if (data.taskId === taskId) {
        setTaskReactions((prev) => {
          if (data.action === 'added') {
            const exists = prev.some((r) => r.emoji === data.emoji && r.userId === data.userId);
            if (exists) return prev;
            return [
              ...prev,
              {
                id: `sock-${Date.now()}`,
                emoji: data.emoji,
                taskId: data.taskId,
                userId: data.userId,
                user: data.user,
                createdAt: new Date().toISOString(),
              },
            ];
          } else {
            return prev.filter((r) => !(r.emoji === data.emoji && r.userId === data.userId));
          }
        });
      }
    };

    const handleCommentReactionToggled = (data: {
      taskId: string;
      commentId: string;
      emoji: string;
      userId: string;
      user?: any;
      action: 'added' | 'removed';
    }) => {
      if (data.taskId === taskId) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id !== data.commentId) return c;
            const current = c.reactions || [];
            if (data.action === 'added') {
              const exists = current.some((r) => r.emoji === data.emoji && r.userId === data.userId);
              if (exists) return c;
              return {
                ...c,
                reactions: [
                  ...current,
                  {
                    id: `sock-${Date.now()}`,
                    emoji: data.emoji,
                    commentId: data.commentId,
                    userId: data.userId,
                    user: data.user,
                    createdAt: new Date().toISOString(),
                  },
                ],
              };
            } else {
              return {
                ...c,
                reactions: current.filter((r) => !(r.emoji === data.emoji && r.userId === data.userId)),
              };
            }
          }),
        );
      }
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:updated', handleCommentUpdated);
    socket.on('comment:deleted', handleCommentDeleted);
    socket.on('task:typing', handleTaskTyping);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:reaction:toggled', handleTaskReactionToggled);
    socket.on('comment:reaction:toggled', handleCommentReactionToggled);

    return () => {
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:updated', handleCommentUpdated);
      socket.off('comment:deleted', handleCommentDeleted);
      socket.off('task:typing', handleTaskTyping);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:reaction:toggled', handleTaskReactionToggled);
      socket.off('comment:reaction:toggled', handleCommentReactionToggled);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (descTimerRef.current) clearTimeout(descTimerRef.current);
    };
  }, [socket, taskId, user?.id]);

  // Deep-link anchor detection for #comment-...
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#comment-')) {
        const commentId = hash.replace('#comment-', '');
        setHighlightedCommentId(commentId);
        setTimeout(() => {
          const el = document.getElementById(`comment-${commentId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
        const timer = setTimeout(() => {
          setHighlightedCommentId(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [taskId, comments.length]);

  // Fetch task and context
  useEffect(() => {
    if (!taskId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const fetchedTask = await api.tasks.getById(taskId);
        setTask(fetchedTask);
        setTitle(fetchedTask.title);
        setDescription(fetchedTask.description || '');
        setStatus(fetchedTask.status);
        setCustomStatus(fetchedTask.customStatus || null);
        setPriority(fetchedTask.priority);
        setAssigneeId(fetchedTask.assigneeId || null);
        setProjectId(fetchedTask.projectId);
        setCycleId(fetchedTask.cycleId || null);
        setEstimate(fetchedTask.estimate || 1);
        setDueDate(fetchedTask.dueDate ? new Date(fetchedTask.dueDate).toISOString().split('T')[0] : '');
        setLabels(fetchedTask.labels || []);
        setComments(fetchedTask.comments || []);
        setActivities(fetchedTask.activities || []);
        setTaskReactions(fetchedTask.reactions || []);
        setSubscribers(fetchedTask.subscribers || []);

        if (fetchedTask.workspaceId) {
          const [wsDetails, tasksList, wsSections, wsCycles] = await Promise.all([
            api.workspaces.getById(fetchedTask.workspaceId),
            api.tasks.getAll({ workspaceId: fetchedTask.workspaceId }),
            api.workspaces.getSections(fetchedTask.workspaceId).catch(() => []),
            api.cycles.getAll(fetchedTask.workspaceId).catch(() => []),
          ]);
          setMembers(wsDetails.members || []);
          setAllTasks(tasksList);
          setSections(wsSections || []);
          setCycles(wsCycles || []);
        }
      } catch (err) {
        console.error('Failed to load issue:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskId]);

  // Debounced auto-save for description & title
  const triggerSave = useCallback(
    async (updates: Partial<Task>) => {
      const currentTaskId = taskRef.current?.id || taskId;
      if (!currentTaskId) return;
      setSaveStatus('saving');
      try {
        const updated = await api.tasks.update(currentTaskId, updates);
        setTask((prev) => (prev ? { ...prev, ...updates, ...(updated || {}) } : null));
        if (updated && Array.isArray(updated.activities)) {
          setActivities(updated.activities);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('idle');
      }
    },
    [taskId],
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    lastLocalTitleTypeRef.current = Date.now();

    const wsId = taskRef.current?.workspaceId || workspace?.id;
    if (socket) {
      socket.emit('task:typing', {
        workspaceId: wsId,
        taskId: taskId,
        field: 'title',
        value: val,
        userId: user?.id,
        userName: user?.name || 'A teammate',
      });
    }

    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      if (val.trim() && val.trim() !== taskRef.current?.title) {
        triggerSave({ title: val.trim() });
      }
    }, 600);
  };

  const handleTitleBlur = () => {
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
      titleTimerRef.current = null;
    }
    if (taskRef.current && title.trim() && title.trim() !== taskRef.current.title) {
      triggerSave({ title: title.trim() });
    }
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    lastLocalDescTypeRef.current = Date.now();

    const wsId = taskRef.current?.workspaceId || workspace?.id;
    if (socket) {
      socket.emit('task:typing', {
        workspaceId: wsId,
        taskId: taskId,
        field: 'description',
        value: val,
        userId: user?.id,
        userName: user?.name || 'A teammate',
      });
    }

    if (descTimerRef.current) clearTimeout(descTimerRef.current);
    descTimerRef.current = setTimeout(() => {
      if (val !== (taskRef.current?.description || '')) {
        triggerSave({ description: val });
      }
    }, 800);
  };

  const handleDescBlur = () => {
    if (descTimerRef.current) {
      clearTimeout(descTimerRef.current);
      descTimerRef.current = null;
    }
    if (taskRef.current && description !== (taskRef.current.description || '')) {
      triggerSave({ description });
    }
  };

  const handleUploadImageFile = async (
    file: File,
    textarea: HTMLTextAreaElement | null,
    currentVal: string,
    onValueUpdate: (val: string | ((prev: string) => string)) => void,
    onSave?: (val: string) => void,
    setIsUploading?: (val: boolean) => void,
  ) => {
    if (!file.type.startsWith('image/')) return;

    if (setIsUploading) setIsUploading(true);
    const ext = file.type.split('/')[1] || 'png';
    const cleanFileName = file.name && file.name !== 'image.png'
      ? file.name
      : `image-${Date.now()}.${ext}`;

    const placeholder = `\n![Uploading ${cleanFileName}...]()\n`;

    const start = textarea?.selectionStart ?? currentVal.length;
    const end = textarea?.selectionEnd ?? currentVal.length;
    const before = currentVal.slice(0, start);
    const after = currentVal.slice(end);
    const textWithPlaceholder = before + placeholder + after;

    onValueUpdate(textWithPlaceholder);

    try {
      const res = await api.uploads.upload(file, taskId);
      const finalUrl = resolveMediaUrl(res.url);
      const markdown = `\n![${cleanFileName}](${finalUrl})\n`;

      onValueUpdate((prev: string) => {
        const updated = prev.includes(placeholder)
          ? prev.replace(placeholder, markdown)
          : `${prev}${markdown}`;
        if (onSave) {
          onSave(updated);
        }
        return updated;
      });
    } catch (err: any) {
      console.error('Image upload failed:', err);
      onValueUpdate((prev: string) => {
        return prev.replace(placeholder, `\n<!-- Upload failed: ${err.message || 'Upload error'} -->\n`);
      });
    } finally {
      if (setIsUploading) setIsUploading(false);
    }
  };

  const handlePasteToTextarea = (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    currentVal: string,
    onValueUpdate: (val: string | ((prev: string) => string)) => void,
    onSave?: (val: string) => void,
    setIsUploading?: (val: boolean) => void,
  ) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imgItem = Array.from(items).find((item) => item.type.startsWith('image/'));
    if (!imgItem) return;

    e.preventDefault();
    const file = imgItem.getAsFile();
    if (file) {
      handleUploadImageFile(file, e.currentTarget, currentVal, onValueUpdate, onSave, setIsUploading);
    }
  };

  const handleDropToTextarea = (
    e: React.DragEvent<HTMLTextAreaElement>,
    currentVal: string,
    onValueUpdate: (val: string | ((prev: string) => string)) => void,
    onSave?: (val: string) => void,
    setIsUploading?: (val: boolean) => void,
  ) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imgFile = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (imgFile) {
      e.preventDefault();
      handleUploadImageFile(imgFile, e.currentTarget, currentVal, onValueUpdate, onSave, setIsUploading);
    }
  };

  // Immediate Property Changes
  const handleStatusChange = async (newStatus: TaskStatus, newCustomStatus?: string | null) => {
    const fromLabel = customStatus
      ? sections.find((s) => s.key === customStatus)?.name || customStatus
      : STATUS_CONFIG[status]?.label || status;
    const toLabel = newCustomStatus
      ? sections.find((s) => s.key === newCustomStatus)?.name || newCustomStatus
      : STATUS_CONFIG[newStatus]?.label || newStatus;

    if (fromLabel !== toLabel && task) {
      const optimisticAct: TaskActivity = {
        id: `opt-${Date.now()}`,
        type: 'STATUS_CHANGE',
        fromValue: fromLabel,
        toValue: toLabel,
        details: `moved from ${fromLabel} to ${toLabel}`,
        taskId: task.id,
        userId: user?.id || 'me',
        user: user || { id: 'me', name: 'You', email: '' },
        createdAt: new Date().toISOString(),
      };
      setActivities((prev) => [optimisticAct, ...prev]);
    }

    setStatus(newStatus);
    setCustomStatus(newCustomStatus || null);
    setActiveDropdown(null);
    triggerSave({ status: newStatus, customStatus: newCustomStatus || null });
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    setPriority(newPriority);
    setActiveDropdown(null);
    triggerSave({ priority: newPriority });
  };

  const handleAssigneeChange = async (newAssigneeId: string | null) => {
    if (task) {
      const newMember = newAssigneeId ? members.find((m) => m.userId === newAssigneeId) : null;
      const newName = newMember?.user?.name || (newAssigneeId ? 'Someone' : null);
      const optimisticAct: TaskActivity = {
        id: `opt-${Date.now()}`,
        type: 'ASSIGNEE_CHANGE',
        fromValue: assigneeId ? members.find((m) => m.userId === assigneeId)?.user?.name || null : null,
        toValue: newName,
        details: newName ? `re-assigned to ${newName}` : 'unassigned this issue',
        taskId: task.id,
        userId: user?.id || 'me',
        user: user || { id: 'me', name: 'You', email: '' },
        createdAt: new Date().toISOString(),
      };
      setActivities((prev) => [optimisticAct, ...prev]);
    }

    setAssigneeId(newAssigneeId);
    setActiveDropdown(null);
    triggerSave({ assigneeId: newAssigneeId });
  };

  const handleProjectChange = async (newProjectId: string) => {
    setProjectId(newProjectId);
    setActiveDropdown(null);
    triggerSave({ projectId: newProjectId });
  };

  const handleCycleChange = async (newCycleId: string | null) => {
    setCycleId(newCycleId);
    setActiveDropdown(null);
    triggerSave({ cycleId: newCycleId });
  };

  const handleEstimateChange = async (newEstimate: number) => {
    setEstimate(newEstimate);
    setActiveDropdown(null);
    triggerSave({ estimate: newEstimate });
  };

  // Keyboard shortcut listener (Linear style: S for status, P for priority, A for assignee, 0-5 to select)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (e.key === 'Escape') {
        setActiveDropdown(null);
        return;
      }

      if (activeDropdown === 'status') {
        if (e.key === '1') {
          e.preventDefault();
          handleStatusChange('BACKLOG');
        } else if (e.key === '2') {
          e.preventDefault();
          handleStatusChange('TODO');
        } else if (e.key === '3') {
          e.preventDefault();
          handleStatusChange('IN_PROGRESS');
        } else if (e.key === '4') {
          e.preventDefault();
          handleStatusChange('DONE');
        } else if (e.key === '5') {
          e.preventDefault();
          handleStatusChange('CANCELED');
        }
        return;
      }

      if (activeDropdown === 'priority') {
        if (e.key === '0') {
          e.preventDefault();
          handlePriorityChange('NO_PRIORITY');
        } else if (e.key === '1') {
          e.preventDefault();
          handlePriorityChange('URGENT');
        } else if (e.key === '2') {
          e.preventDefault();
          handlePriorityChange('HIGH');
        } else if (e.key === '3') {
          e.preventDefault();
          handlePriorityChange('MEDIUM');
        } else if (e.key === '4') {
          e.preventDefault();
          handlePriorityChange('LOW');
        }
        return;
      }

      if (!isInput) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          setActiveDropdown((prev) => (prev === 'status' ? null : 'status'));
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setActiveDropdown((prev) => (prev === 'priority' ? null : 'priority'));
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setActiveDropdown((prev) => (prev === 'assignee' ? null : 'assignee'));
        } else if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          setActiveDropdown((prev) => (prev === 'labels' ? null : 'labels'));
          setLabelSearch('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDropdown, task]);

  const handleDueDateChange = async (newDate: string) => {
    setDueDate(newDate);
    triggerSave({ dueDate: newDate ? new Date(newDate).toISOString() : null });
  };

  const handleRemoveLabel = async (labelToRemove: string) => {
    const updated = labels.filter((l) => l !== labelToRemove);
    setLabels(updated);
    triggerSave({ labels: updated });
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    try {
      await api.tasks.delete(task.id);
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyId = () => {
    if (!task) return;
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(task.identifier);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const uniqueCommenters = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatarUrl?: string | null }>();
    comments.forEach((c) => {
      if (c.user && !map.has(c.user.id)) {
        map.set(c.user.id, {
          id: c.user.id,
          name: c.user.name || 'User',
          avatarUrl: c.user.avatarUrl || undefined,
        });
      }
    });
    return Array.from(map.values());
  }, [comments]);

  const handleCopyBranch = () => {
    if (!task) return;
    const cleanTitle = (task.title || 'issue')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 45);
    const branchName = `${task.identifier.toLowerCase()}-${cleanTitle}`;

    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(branchName);
      setCopiedBranch(true);
      setTimeout(() => setCopiedBranch(false), 2000);

      // Linear behavior: automatically move to In Progress when developer copies branch name!
      if (status !== 'IN_PROGRESS' || customStatus) {
        handleStatusChange('IN_PROGRESS', null);
      }
    }
  };

  const isSubscribed = useMemo(() => {
    if (!user) return false;
    const hasSub = subscribers.some((s) => s.userId === user.id || s.user?.id === user.id);
    const isAssignee = assigneeId === user.id;
    return hasSub || isAssignee;
  }, [subscribers, user, assigneeId]);

  const handleToggleSubscribe = async () => {
    if (!task || !user || isSubscribing) return;
    setIsSubscribing(true);
    const currentlySubscribed = isSubscribed;
    try {
      if (currentlySubscribed) {
        await api.tasks.unsubscribe(task.id);
        setSubscribers((prev) => prev.filter((s) => s.userId !== user.id && s.user?.id !== user.id));
      } else {
        const res = await api.tasks.subscribe(task.id);
        const newSub = res.subscription || {
          id: `sub-${Date.now()}`,
          taskId: task.id,
          userId: user.id,
          user: user,
          createdAt: new Date().toISOString(),
        };
        setSubscribers((prev) => [...prev, newSub]);
      }
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const rootComments = useMemo(() => {
    return comments.filter((c) => !c.parentId);
  }, [comments]);

  const handleStartReply = (comment: TaskComment) => {
    const parentId = comment.parentId || comment.id;
    const authorName = comment.user?.name;
    if (authorName) {
      setReplyTextMap((prev) => {
        const curr = prev[parentId] || '';
        const tag = `@${authorName} `;
        return {
          ...prev,
          [parentId]: curr.includes(`@${authorName}`) ? curr : (curr ? `${curr} ${tag}` : tag),
        };
      });
    }
    setTimeout(() => {
      const inputEl = replyInputRefs.current[parentId];
      if (inputEl) {
        inputEl.focus();
        const len = inputEl.value.length;
        inputEl.setSelectionRange(len, len);
      }
    }, 50);
  };

  // Reply Mention Autocomplete Matching
  const matchingReplyMembers = useMemo(() => {
    if (replyMentionQuery === null) return [];
    const q = replyMentionQuery.toLowerCase().trim();
    return members
      .filter((m) => {
        if (!q) return true;
        const name = (m.user?.name || '').toLowerCase();
        const email = (m.user?.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice(0, 5);
  }, [members, replyMentionQuery]);

  const handleReplyTextChange = (parentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart ?? text.length;
    setReplyTextMap((prev) => ({ ...prev, [parentId]: text }));

    // Look backward from cursor to detect '@'
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
      const charBeforeAt = lastAtPos > 0 ? textBeforeCursor[lastAtPos - 1] : ' ';
      if ((charBeforeAt === ' ' || lastAtPos === 0) && textAfterAt.length <= 25) {
        setReplyMentionParentId(parentId);
        setReplyMentionQuery(textAfterAt);
        setReplyMentionCursorPos(lastAtPos);
        setReplyMentionIndex(0);
        return;
      }
    }

    if (replyMentionParentId === parentId) {
      setReplyMentionParentId(null);
      setReplyMentionQuery(null);
    }
  };

  const handleSelectReplyMention = (parentId: string, userName: string) => {
    if (replyMentionCursorPos === -1) return;
    const currentText = replyTextMap[parentId] || '';
    const textBeforeAt = currentText.slice(0, replyMentionCursorPos);
    const inputEl = replyInputRefs.current[parentId];
    const currentCursor =
      inputEl?.selectionStart ?? (replyMentionCursorPos + (replyMentionQuery?.length || 0) + 1);
    const textAfterCursor = currentText.slice(currentCursor);
    const inserted = `${textBeforeAt}@${userName} ${textAfterCursor}`;
    setReplyTextMap((prev) => ({ ...prev, [parentId]: inserted }));
    setReplyMentionParentId(null);
    setReplyMentionQuery(null);

    setTimeout(() => {
      if (inputEl) {
        inputEl.focus();
        const newPos = replyMentionCursorPos + userName.length + 2;
        inputEl.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleTriggerReplyMention = (parentId: string) => {
    const inputEl = replyInputRefs.current[parentId];
    setReplyTextMap((prev) => {
      const curr = prev[parentId] || '';
      const spacer = curr && !curr.endsWith(' ') ? ' ' : '';
      return { ...prev, [parentId]: `${curr}${spacer}@` };
    });
    setReplyMentionParentId(parentId);
    setReplyMentionQuery('');
    setReplyMentionIndex(0);
    setTimeout(() => {
      if (inputEl) {
        inputEl.focus();
        const pos = inputEl.value.length;
        setReplyMentionCursorPos(pos - 1);
        inputEl.setSelectionRange(pos, pos);
      }
    }, 10);
  };

  const handleReplyKeyDown = (parentId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      replyMentionParentId === parentId &&
      replyMentionQuery !== null &&
      matchingReplyMembers.length > 0
    ) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setReplyMentionIndex((prev) => (prev + 1) % matchingReplyMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setReplyMentionIndex((prev) => (prev - 1 + matchingReplyMembers.length) % matchingReplyMembers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = matchingReplyMembers[replyMentionIndex];
        if (selected?.user?.name) {
          handleSelectReplyMention(parentId, selected.user.name);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setReplyMentionParentId(null);
        setReplyMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendNestedReply(parentId);
    }
  };

  const handleSendNestedReply = async (parentCommentId: string) => {
    const text = replyTextMap[parentCommentId]?.trim();
    if (!text || submittingReplyMap[parentCommentId] || !task) return;

    setSubmittingReplyMap((prev) => ({ ...prev, [parentCommentId]: true }));
    const parentComment = comments.find((c) => c.id === parentCommentId);

    const tempReply: TaskComment = {
      id: `temp-${Date.now()}`,
      content: text,
      taskId: task.id,
      userId: user?.id || 'me',
      user: user || { id: 'me', name: 'You', email: '' },
      parentId: parentCommentId,
      parent: parentComment
        ? {
            id: parentComment.id,
            content: parentComment.content,
            user: parentComment.user,
          }
        : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, tempReply]);
    setReplyTextMap((prev) => ({ ...prev, [parentCommentId]: '' }));

    try {
      const serverComment = await api.tasks.addComment(task.id, text, parentCommentId);
      if (user && !subscribers.some((s) => s.userId === user.id || s.user?.id === user.id)) {
        const newSub: TaskSubscription = {
          id: `sub-${Date.now()}`,
          taskId: task.id,
          userId: user.id,
          user: user,
          createdAt: new Date().toISOString(),
        };
        setSubscribers((prev) => [...prev, newSub]);
      }
      setComments((prev) => {
        const alreadyHasServer = prev.some((c) => c.id === serverComment.id);
        if (alreadyHasServer) {
          return prev.filter((c) => c.id !== tempReply.id);
        }
        return prev.map((c) => (c.id === tempReply.id ? serverComment : c));
      });
    } catch (err) {
      console.error('Failed to post reply:', err);
      setComments((prev) => prev.filter((c) => c.id !== tempReply.id));
    } finally {
      setSubmittingReplyMap((prev) => ({ ...prev, [parentCommentId]: false }));
    }
  };

  const handleReplyImageUpload = async (parentCommentId: string, file: File) => {
    if (!file.type.startsWith('image/') || !task) return;
    setReplyUploadingMap((prev) => ({ ...prev, [parentCommentId]: true }));
    const ext = file.type.split('/')[1] || 'png';
    const cleanFileName = file.name || `image-${Date.now()}.${ext}`;
    try {
      const res = await api.uploads.upload(file, task.id);
      const finalUrl = resolveMediaUrl(res.url);
      const md = `![${cleanFileName}](${finalUrl})`;
      setReplyTextMap((prev) => {
        const curr = prev[parentCommentId] || '';
        return { ...prev, [parentCommentId]: curr ? `${curr} ${md}` : md };
      });
    } catch (err) {
      console.error('Failed to upload reply image:', err);
    } finally {
      setReplyUploadingMap((prev) => ({ ...prev, [parentCommentId]: false }));
    }
  };

  // Mention Autocomplete Matching
  const matchingMembers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase().trim();
    return members
      .filter((m) => {
        const name = (m.user?.name || '').toLowerCase();
        const email = (m.user?.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice(0, 5);
  }, [members, mentionQuery]);

  const handleCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewCommentText(text);

    // Look backward from cursor to detect '@'
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
      const charBeforeAt = lastAtPos > 0 ? textBeforeCursor[lastAtPos - 1] : ' ';
      if (
        (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtPos === 0) &&
        !textAfterAt.includes('\n') &&
        textAfterAt.length <= 25
      ) {
        setMentionQuery(textAfterAt);
        setMentionCursorPos(lastAtPos);
        setMentionIndex(0);
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleSelectMention = (userName: string) => {
    if (mentionCursorPos === -1) return;
    const textBeforeAt = newCommentText.slice(0, mentionCursorPos);
    const currentCursor =
      commentTextareaRef.current?.selectionStart ||
      mentionCursorPos + (mentionQuery?.length || 0) + 1;
    const textAfterCursor = newCommentText.slice(currentCursor);
    const inserted = `${textBeforeAt}@${userName} ${textAfterCursor}`;
    setNewCommentText(inserted);
    setMentionQuery(null);

    setTimeout(() => {
      if (commentTextareaRef.current) {
        commentTextareaRef.current.focus();
        const newPos = mentionCursorPos + userName.length + 2;
        commentTextareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && matchingMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % matchingMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + matchingMembers.length) % matchingMembers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = matchingMembers[mentionIndex];
        if (selected?.user?.name) {
          handleSelectMention(selected.user.name);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // Update Project Prefix Key (e.g. TJAR)
  const handleUpdatePrefix = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = newPrefix.trim().toUpperCase();
    if (!cleanKey || !activeProject) return;
    setUpdatingPrefix(true);
    try {
      await api.projects.update(activeProject.id, { key: cleanKey });

      // Update current task identifier in memory
      setTask((prev) => {
        if (!prev) return null;
        let suffix = '1';
        const match = prev.identifier.match(/-(\d+)$/);
        if (match) suffix = match[1];
        return {
          ...prev,
          identifier: `${cleanKey}-${suffix}`,
          project: prev.project ? { ...prev.project, key: cleanKey } : undefined,
        };
      });

      // Update all tasks belonging to this project in memory
      setAllTasks((prev) =>
        prev.map((t) => {
          if (t.projectId === activeProject.id) {
            let s = '1';
            const m = t.identifier.match(/-(\d+)$/);
            if (m) s = m[1];
            return { ...t, identifier: `${cleanKey}-${s}` };
          }
          return t;
        }),
      );

      setShowPrefixModal(false);
    } catch (err) {
      console.error('Failed to update project prefix:', err);
    } finally {
      setUpdatingPrefix(false);
    }
  };

  // Comments Handling
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || submittingComment || !task) return;

    setSubmittingComment(true);
    const content = newCommentText.trim();
    const parentId = replyingTo?.id;
    const parentSnippet = replyingTo
      ? {
          id: replyingTo.id,
          content: replyingTo.contentPreview,
          user: { name: replyingTo.authorName } as any,
        }
      : undefined;

    const tempComment: TaskComment = {
      id: `temp-${Date.now()}`,
      content,
      taskId: task.id,
      userId: user?.id || 'me',
      user: user || { id: 'me', name: 'You', email: '' },
      parentId: parentId || null,
      parent: parentSnippet,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, tempComment]);
    setNewCommentText('');
    setReplyingTo(null);

    try {
      const serverComment = await api.tasks.addComment(task.id, content, parentId);
      // Auto-subscribe user locally since commenting automatically subscribes
      if (user && !subscribers.some((s) => s.userId === user.id || s.user?.id === user.id)) {
        const newSub: TaskSubscription = {
          id: `sub-${Date.now()}`,
          taskId: task.id,
          userId: user.id,
          user: user,
          createdAt: new Date().toISOString(),
        };
        setSubscribers((prev) => [...prev, newSub]);
      }
      setComments((prev) => {
        const alreadyHasServerComment = prev.some((c) => c.id === serverComment.id);
        if (alreadyHasServerComment) {
          return prev.filter((c) => c.id !== tempComment.id);
        }
        return prev.map((c) => (c.id === tempComment.id ? serverComment : c));
      });
    } catch (err) {
      console.error('Failed to post comment:', err);
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleResubmitRequest = async (overrideComment?: string) => {
    if (!task || isResubmitting) return;
    setIsResubmitting(true);
    const commentToSend = typeof overrideComment === 'string' ? overrideComment : newCommentText.trim();
    try {
      const updated = await api.tasks.updateTriageStatus(task.id, {
        action: 'RESUBMIT',
        comment: commentToSend || undefined,
      });
      setTask(updated);
      if (commentToSend) {
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Failed to resubmit request:', err);
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await api.tasks.deleteComment(task.id, commentId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditComment = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editingCommentText.trim() || isUpdatingComment || !task) return;
    setIsUpdatingComment(true);
    const content = editingCommentText.trim();
    try {
      const updated = await api.tasks.updateComment(task.id, commentId, content);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c)),
      );
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      console.error('Failed to update comment:', err);
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleCopyCommentLink = (commentId: string) => {
    const url = `${window.location.origin}/issue/${task?.id || taskId}#comment-${commentId}`;
    navigator.clipboard.writeText(url);
    window.history.replaceState(null, '', `#comment-${commentId}`);
    setCopiedCommentId(commentId);
    setHighlightedCommentId(commentId);
    setTimeout(() => {
      setCopiedCommentId((curr) => (curr === commentId ? null : curr));
    }, 2000);
  };

  // Edit Comment Mention Matching
  const matchingEditMembers = useMemo(() => {
    if (editingMentionQuery === null) return [];
    const q = editingMentionQuery.toLowerCase().trim();
    return members
      .filter((m) => {
        const name = (m.user?.name || '').toLowerCase();
        const email = (m.user?.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice(0, 5);
  }, [members, editingMentionQuery]);

  const handleEditCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    setEditingCommentText(text);

    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
      const charBeforeAt = lastAtPos > 0 ? textBeforeCursor[lastAtPos - 1] : ' ';
      if (
        (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtPos === 0) &&
        !textAfterAt.includes('\n') &&
        textAfterAt.length <= 25
      ) {
        setEditingMentionQuery(textAfterAt);
        setEditingMentionCursorPos(lastAtPos);
        setEditingMentionIndex(0);
        return;
      }
    }
    setEditingMentionQuery(null);
  };

  const handleSelectEditMention = (userName: string) => {
    if (editingMentionCursorPos === -1) return;
    const textBeforeAt = editingCommentText.slice(0, editingMentionCursorPos);
    const currentCursor =
      editCommentTextareaRef.current?.selectionStart ||
      editingMentionCursorPos + (editingMentionQuery?.length || 0) + 1;
    const textAfterCursor = editingCommentText.slice(currentCursor);
    const inserted = `${textBeforeAt}@${userName} ${textAfterCursor}`;
    setEditingCommentText(inserted);
    setEditingMentionQuery(null);

    setTimeout(() => {
      if (editCommentTextareaRef.current) {
        editCommentTextareaRef.current.focus();
        const newPos = editingMentionCursorPos + userName.length + 2;
        editCommentTextareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleEditCommentKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    commentId: string,
  ) => {
    if (editingMentionQuery !== null && matchingEditMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setEditingMentionIndex((prev) => (prev + 1) % matchingEditMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setEditingMentionIndex((prev) => (prev - 1 + matchingEditMembers.length) % matchingEditMembers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = matchingEditMembers[editingMentionIndex];
        if (selected?.user?.name) {
          handleSelectEditMention(selected.user.name);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setEditingMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEditComment(commentId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditComment();
    }
  };

  // Reactions Handlers
  const handleToggleTaskReaction = async (emoji: string) => {
    const currentTaskId = task?.id || taskId;
    if (!currentTaskId || !user) return;
    const existing = taskReactions.find((r) => r.emoji === emoji && r.userId === user.id);
    let updated: TaskReaction[];
    if (existing) {
      updated = taskReactions.filter((r) => r.id !== existing.id && !(r.emoji === emoji && r.userId === user.id));
    } else {
      const opt: TaskReaction = {
        id: `opt-${Date.now()}`,
        emoji,
        taskId: currentTaskId,
        userId: user.id,
        user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
        createdAt: new Date().toISOString(),
      };
      updated = [...taskReactions, opt];
    }
    setTaskReactions(updated);

    try {
      const res = await api.tasks.toggleTaskReaction(currentTaskId, emoji);
      if (res.action === 'added' && res.reaction) {
        setTaskReactions((prev) => [
          ...prev.filter((r) => !(r.emoji === emoji && r.userId === user.id)),
          res.reaction!,
        ]);
      }
    } catch (err) {
      console.error('Failed to toggle task reaction:', err);
      setTaskReactions(task?.reactions || []);
    }
  };

  const handleToggleCommentReaction = async (commentId: string, emoji: string) => {
    const currentTaskId = task?.id || taskId;
    if (!currentTaskId || !user) return;
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const currentReactions = c.reactions || [];
        const existing = currentReactions.find((r) => r.emoji === emoji && r.userId === user.id);
        const updatedReactions = existing
          ? currentReactions.filter((r) => !(r.emoji === emoji && r.userId === user.id))
          : [
              ...currentReactions,
              {
                id: `opt-${Date.now()}`,
                emoji,
                commentId,
                userId: user.id,
                user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
                createdAt: new Date().toISOString(),
              },
            ];
        return { ...c, reactions: updatedReactions };
      }),
    );

    try {
      const res = await api.tasks.toggleCommentReaction(currentTaskId, commentId, emoji);
      if (res.action === 'added' && res.reaction) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id !== commentId) return c;
            return {
              ...c,
              reactions: [
                ...(c.reactions || []).filter((r) => !(r.emoji === emoji && r.userId === user.id)),
                res.reaction!,
              ],
            };
          }),
        );
      }
    } catch (err) {
      console.error('Failed to toggle comment reaction:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-foreground flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-white mb-2">Issue not found</h2>
        <p className="text-xs text-muted-foreground mb-4">The issue may have been removed or moved.</p>
        <Link href="/">
          <Button variant="linear" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Issues
          </Button>
        </Link>
      </div>
    );
  }

  const currentIndex = allTasks.findIndex((t) => t.id === task.id);
  const totalTasks = allTasks.length;

  const handlePrevTask = () => {
    if (currentIndex > 0) {
      router.push(`/issue/${allTasks[currentIndex - 1].id}`);
    }
  };

  const handleNextTask = () => {
    if (currentIndex < totalTasks - 1) {
      router.push(`/issue/${allTasks[currentIndex + 1].id}`);
    }
  };

  const activeProject = projects.find((p) => p.id === projectId) || task.project;
  const currentAssignee = members.find((m) => m.userId === assigneeId)?.user || task.assignee;

  return (
    <div className="min-h-screen bg-[#090a0f] text-foreground flex flex-col font-sans select-text">
      {/* Top Header Bar matching Linear screenshot */}
      <header className="sticky top-0 z-40 w-full h-11 flex items-center justify-between px-4 sm:px-6 border-b border-[#1f202b] bg-[#090a0f]/95 backdrop-blur-md select-none shrink-0">
        {/* Left: Identifier, Title, Favorite & Menu */}
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground overflow-hidden">
          <Link
            href="/"
            className="p-1 rounded hover:bg-[#1a1b26] text-zinc-400 hover:text-white transition-colors"
            title="Back to board (Esc)"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => {
              setNewPrefix(activeProject?.key || 'TJAR');
              setShowPrefixModal(true);
            }}
            className="font-mono font-medium text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Click to change project issue prefix (e.g. TJAR)"
          >
            {task.identifier}
          </button>

          <span className="text-zinc-200 font-medium hidden sm:inline truncate max-w-[340px]">
            {task.title}
          </span>

          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={cn(
              "p-1 rounded hover:bg-[#1a1b26] transition-colors ml-0.5",
              isFavorite ? "text-amber-400" : "text-zinc-500 hover:text-amber-400"
            )}
            title="Favorite"
          >
            <Star className={cn("w-3.5 h-3.5", isFavorite && "fill-amber-400")} />
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="p-1 rounded hover:bg-[#1a1b26] text-zinc-500 hover:text-zinc-300 transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Auto-save status, Live typing, 4 minimal stroke icons (Link, Copy ID, Git, Close) */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
          {/* Real-time Auto-save feedback */}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400 mr-1 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 mr-1">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Saved</span>
            </span>
          )}

          {/* Live Typing Indicator */}
          {typingIndicator && (
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 mr-2 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping inline-block" />
              <span>{typingIndicator.userName} is typing...</span>
            </span>
          )}

          {/* 1. Copy Link Icon */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-md hover:bg-[#1a1b26] text-zinc-400 hover:text-white transition-colors"
            title="Copy link"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* 2. Copy Identifier Icon */}
          <button
            type="button"
            onClick={handleCopyId}
            className="p-1.5 rounded-md hover:bg-[#1a1b26] text-zinc-400 hover:text-white transition-colors"
            title={`Copy ID (${task.identifier})`}
          >
            {copiedId ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* 3. Copy Git Branch Icon */}
          <button
            type="button"
            onClick={handleCopyBranch}
            className="p-1.5 rounded-md hover:bg-[#1a1b26] text-zinc-400 hover:text-white transition-colors"
            title="Copy git branch name"
          >
            {copiedBranch ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <GitBranch className="w-3.5 h-3.5" />
            )}
          </button>

          {/* 4. Close Icon */}
          <Link
            href="/"
            className="p-1.5 rounded-md hover:bg-[#1a1b26] text-zinc-400 hover:text-white transition-colors"
            title="Close (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Archived / Trash Banner */}
      {task.isArchived && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-red-300 shrink-0">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>This issue is archived in the trash bin.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const restored = await api.tasks.restore(task.id);
                setTask((prev) => (prev ? { ...prev, isArchived: false, deletedAt: null } : null));
              }}
              className="h-6 text-xs text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Issue</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                const ok = window.confirm(`Permanently remove ${task.identifier}? This cannot be undone.`);
                if (!ok) return;
                await api.tasks.permanentDelete(task.id);
                router.push('/');
              }}
              className="h-6 text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Permanently</span>
            </Button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-2.5 flex items-center justify-between text-xs text-destructive shrink-0">
          <span>Delete {task.identifier}: Move to trash or remove permanently?</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteTask}
              className="h-6 text-xs border-destructive/30 hover:bg-destructive/15 text-destructive"
            >
              Move to Trash
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                const ok = window.confirm(`Permanently remove ${task.identifier}? This cannot be undone.`);
                if (!ok) return;
                await api.tasks.permanentDelete(task.id);
                router.push('/');
              }}
              className="h-6 text-xs"
            >
              Delete Permanently
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              className="h-6 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Main Content matching Linear's second screenshot */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 gap-10">
        {/* Left Column: Title & Document Body */}
        <div className="flex-1 space-y-6">
          {/* Issue Title */}
          <div className="relative">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-xl sm:text-2xl font-semibold bg-transparent border-none outline-none focus:ring-0 p-0 text-white placeholder:text-zinc-600 transition-colors tracking-tight"
              placeholder="Issue title..."
              title="Click directly to edit title"
            />
            {typingIndicator && typingIndicator.field === 'title' && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-400 font-medium animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-ping" />
                <span>{typingIndicator.userName} is editing title...</span>
              </div>
            )}
          </div>

          {/* Sub-issue / Parent link banner (Like Linear screenshot) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
            <span className="text-zinc-500">Project:</span>
            <span className="font-medium text-zinc-300">{activeProject?.name || 'General'}</span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-[11px] text-zinc-500">{task.identifier}</span>

            {task.parent && (
              <>
                <span className="text-zinc-600">•</span>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161726] border border-[#2b2c3d] text-zinc-300">
                  <GitFork className="w-3 h-3 text-indigo-400 rotate-180" />
                  <span className="text-zinc-500 text-[11px]">Sub-issue of</span>
                  <Link
                    href={`/issue/${task.parent.id}`}
                    className="font-medium text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span className="font-mono text-zinc-400 text-[11px]">{task.parent.identifier}</span>
                    <span className="truncate max-w-[200px]">{task.parent.title}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.tasks.update(task.id, { parentId: null });
                      setTask((prev) => (prev ? { ...prev, parentId: null, parent: null } : null));
                    }}
                    className="p-0.5 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-rose-400 transition-colors ml-0.5 cursor-pointer"
                    title="Remove from parent issue"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Description Section */}
          <div className="space-y-2 pt-1">
            {typingIndicator && typingIndicator.field === 'description' && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-normal animate-pulse pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block animate-ping" />
                <span>{typingIndicator.userName} is typing...</span>
              </div>
            )}

            <LinearRichEditor
              value={description}
              onChange={(val) => {
                setDescription(val);
                handleDescChange(val);
              }}
              onBlur={handleDescBlur}
              taskId={taskId}
              members={members}
              onImageClick={(url) => setLightboxUrl(url)}
              placeholder="Add description, requirements, bullet points, or context... (Paste images directly here)"
            />

            {/* Task Reactions */}
            <div className="pt-2 flex items-center gap-2">
              <ReactionsBar
                reactions={taskReactions}
                currentUserId={user?.id}
                onToggleReaction={handleToggleTaskReaction}
                size="md"
              />
            </div>
          </div>

          {/* Quick relation icons matching Linear screenshot right below description */}
          <div className="flex items-center gap-2 pt-1 pb-1 text-zinc-500">
            <button
              type="button"
              onClick={() => subIssuesRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="p-1.5 rounded hover:bg-[#1a1b26] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Jump to Sub-issues"
            >
              <GitFork className="w-4 h-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => relatedIssuesRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="p-1.5 rounded hover:bg-[#1a1b26] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Jump to Related issues"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-issues Section (exact layout from screenshot) */}
          <div ref={subIssuesRef}>
            <SubIssuesSection
              parentTask={task}
              subTasks={task.subTasks || []}
              members={members}
              allTasks={allTasks}
              onSubTasksChange={(updatedSubTasks) => {
                setTask((prev) => (prev ? { ...prev, subTasks: updatedSubTasks } : null));
              }}
            />
          </div>

          {/* Related Issues Section */}
          <div ref={relatedIssuesRef}>
            <RelatedIssuesSection
              task={task}
              allTasks={allTasks}
              onTaskChange={(updatedTask) => {
                setTask(updatedTask);
              }}
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-3 pt-6 border-t border-border/40">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attachments & Uploads</span>
              </span>
            </div>

            <FileUploader
              taskId={task.id}
              attachments={task.attachments || []}
              onUploadSuccess={(att) => {
                const updatedAttachments = [...(task.attachments || []), att];
                setTask((prev) => (prev ? { ...prev, attachments: updatedAttachments } : null));
              }}
              onDeleteSuccess={(id) => {
                const updatedAttachments = (task.attachments || []).filter((a) => a.id !== id);
                setTask((prev) => (prev ? { ...prev, attachments: updatedAttachments } : null));
              }}
            />
          </div>

          {/* Activity & Comments Stream */}
          <div className="space-y-3 pt-6 border-t border-[#1f202b]">
            {/* Linear Style Comments Summary Bar (Collapsible) matching user's screenshot */}
            {rootComments.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
                className="w-full flex items-center justify-between py-2 px-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors group cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {/* Stacked avatars */}
                  <div className="flex -space-x-1.5 shrink-0">
                    {uniqueCommenters.slice(0, 3).map((cm, idx) => (
                      <div
                        key={cm.id}
                        className={cn(
                          "w-5 h-5 rounded-full ring-2 ring-[#090a0f] overflow-hidden flex items-center justify-center font-bold text-[8px] text-white shrink-0",
                          idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-sky-500" : "bg-indigo-500"
                        )}
                      >
                        {cm.avatarUrl ? (
                          <img src={cm.avatarUrl} alt={cm.name} className="w-full h-full object-cover" />
                        ) : (
                          cm.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                        )}
                      </div>
                    ))}
                  </div>

                  <span className="truncate text-xs text-zinc-400 group-hover:text-zinc-200 font-normal">
                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'} from{' '}
                    {uniqueCommenters.slice(0, 2).map((cm) => cm.name).join(' and ')}
                    {uniqueCommenters.length > 2 && ` and ${uniqueCommenters.length - 2} other`}
                  </span>
                </div>

                <div className="shrink-0 p-1 text-zinc-500 group-hover:text-zinc-300">
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200',
                      isCommentsCollapsed && '-rotate-90'
                    )}
                  />
                </div>
              </button>
            )}

            {/* Needs Revision Chat & Resubmit Banner */}
            {task.triageStatus === 'REJECTED' && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-1">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-rose-200">Request Needs Revision</div>
                    <p className="text-zinc-300 text-[11px] mt-0.5">
                      Chat directly below to clarify requirements or supply updates. You don&apos;t need to create another backlog ticket.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleResubmitRequest()}
                  disabled={isResubmitting}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
                >
                  {isResubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Resubmit for Review</span>
                </button>
              </div>
            )}

            {/* Comments List (Clean Chat-like Stream) */}
            {!isCommentsCollapsed && (
              <div className="space-y-1">
                {rootComments.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-600">
                    No comments yet. Start the conversation below.
                  </div>
                ) : (
                  rootComments.map((c) => {
                    const commentMember = members.find(
                      (m) => m.userId === c.userId || m.user?.id === c.userId,
                    );
                    const isCommentAuthorOnline = user?.id === c.user?.id;
                    const replies = comments.filter((r) => r.parentId === c.id);

                    return (
                      <div
                        key={c.id}
                        id={`comment-${c.id}`}
                        className={cn(
                          'py-3.5 border-b border-[#181924]/50 transition-all duration-200 group relative',
                          highlightedCommentId === c.id && 'bg-indigo-500/10 rounded-lg p-3 ring-1 ring-indigo-500/40'
                        )}
                      >
                        <div className="flex items-start gap-3">
                        <UserAvatar
                          user={c.user}
                          member={commentMember}
                          size="sm"
                          showStatus={true}
                          status={isCommentAuthorOnline ? 'online' : 'offline'}
                          withHoverCard={true}
                          workspaceName={workspace?.name}
                          className="mt-0.5 cursor-pointer"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <ProfileHoverCard
                              user={c.user}
                              member={commentMember}
                              workspaceName={workspace?.name}
                              status={isCommentAuthorOnline ? 'online' : 'offline'}
                            >
                              <span className="text-xs font-semibold text-foreground hover:underline cursor-pointer">
                                {c.user?.name || 'Team Member'}
                              </span>
                            </ProfileHoverCard>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(c.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {c.updatedAt &&
                              new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 2000 && (
                                <span
                                  className="text-[10px] text-zinc-500 italic"
                                  title={`Edited at ${new Date(c.updatedAt).toLocaleTimeString()}`}
                                >
                                  (edited)
                                </span>
                              )}
                          </div>

                          {editingCommentId === c.id ? (
                            <div className="mt-2 space-y-2 relative">
                              {/* Mentions autocomplete popup while editing comment */}
                              {editingMentionQuery !== null && matchingEditMembers.length > 0 && (
                                <div className="absolute left-0 bottom-full mb-1 z-50 w-64 rounded-xl border border-border/80 bg-[#0e0f18]/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                  <div className="px-3 py-1.5 border-b border-border/50 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <AtSign className="w-3 h-3 text-indigo-400" />
                                      <span>Mention team member</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-normal">↑↓ navigate, ↵ select</span>
                                  </div>
                                  <div className="space-y-0.5 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                    {matchingEditMembers.map((m, idx) => (
                                      <button
                                        key={m.userId}
                                        type="button"
                                        onClick={() => handleSelectEditMention(m.user?.name || 'User')}
                                        className={cn(
                                          'w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                                          idx === editingMentionIndex
                                            ? 'bg-indigo-600/20 text-white font-medium'
                                            : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                                        )}
                                      >
                                        <img
                                          src={
                                            m.user?.avatarUrl ||
                                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                              m.user?.name || 'User',
                                            )}`
                                          }
                                          alt={m.user?.name || 'User'}
                                          className="w-5 h-5 rounded-full object-cover shrink-0"
                                        />
                                        <div className="min-w-0 flex-1 truncate">
                                          <div className="font-medium text-white truncate text-xs">
                                            {m.user?.name}
                                          </div>
                                          <div className="text-[10px] text-zinc-500 truncate">
                                            {m.user?.email}
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <textarea
                                ref={editCommentTextareaRef}
                                value={editingCommentText}
                                onChange={handleEditCommentTextChange}
                                onKeyDown={(e) => handleEditCommentKeyDown(e, c.id)}
                                rows={3}
                                className="w-full bg-[#161726] border border-border focus:border-indigo-500 rounded-lg p-2.5 text-xs text-foreground placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed"
                                autoFocus
                              />

                              {/* Comment image / mention live preview when editing */}
                              {editingCommentText && (editingCommentText.includes('@') || editingCommentText.includes('![')) && (
                                <div className="p-2 border border-border/40 bg-[#0a0b12]/60 rounded text-xs space-y-1">
                                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                                    Live Preview
                                  </span>
                                  <MarkdownRenderer content={editingCommentText} membersList={members} />
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-zinc-500">
                                    Esc to cancel • Cmd+Enter to save
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const text = editingCommentText ? `${editingCommentText} @` : '@';
                                      setEditingCommentText(text);
                                      setEditingMentionQuery('');
                                      setEditingMentionCursorPos(text.length - 1);
                                      setEditingMentionIndex(0);
                                      setTimeout(() => {
                                        if (editCommentTextareaRef.current) {
                                          editCommentTextareaRef.current.focus();
                                          editCommentTextareaRef.current.setSelectionRange(text.length, text.length);
                                        }
                                      }, 10);
                                    }}
                                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
                                    title="Mention a team member"
                                  >
                                    <AtSign className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Mention</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEditComment}
                                    disabled={isUpdatingComment}
                                    className="h-6 text-xs px-2 text-zinc-400 hover:text-white"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="linear"
                                    size="sm"
                                    onClick={() => handleSaveEditComment(c.id)}
                                    disabled={!editingCommentText.trim() || isUpdatingComment}
                                    className="h-6 text-xs px-2.5"
                                  >
                                    {isUpdatingComment ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      <Check className="w-3 h-3 mr-1" />
                                    )}
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="mt-1.5 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {renderCommentContentWithMentions(c.content, members)}
                              </div>

                              {/* Comment Reactions */}
                              <div className="mt-2">
                                <ReactionsBar
                                  reactions={c.reactions || []}
                                  currentUserId={user?.id}
                                  onToggleReaction={(emoji) => handleToggleCommentReaction(c.id, emoji)}
                                  size="sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Reply Button */}
                          <button
                            onClick={() => handleStartReply(c)}
                            className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-indigo-300 transition-colors text-[11px]"
                            title="Reply to comment"
                          >
                            <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="hidden sm:inline">Reply</span>
                          </button>

                          {/* Copy Link to Comment */}
                          <button
                            onClick={() => handleCopyCommentLink(c.id)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors relative"
                            title={copiedCommentId === c.id ? 'Copied!' : 'Copy link to comment'}
                          >
                            {copiedCommentId === c.id ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied</span>
                              </span>
                            ) : (
                              <Link2 className="w-3 h-3" />
                            )}
                          </button>

                          {/* Edit Comment */}
                          {(c.userId === user?.id || workspace?.role === 'OWNER' || workspace?.role === 'ADMIN') && (
                            <button
                              onClick={() => handleStartEditComment(c)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                              title="Edit comment"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}

                          {/* Delete Comment */}
                          {(c.userId === user?.id || workspace?.role === 'OWNER' || workspace?.role === 'ADMIN') && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="p-1 rounded hover:bg-destructive/20 text-zinc-500 hover:text-destructive transition-all"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nested Thread Section (Matches Screenshot) */}
                      <div className="mt-3 pt-2.5 border-t border-border/30 space-y-3">
                        {/* Thread replies list */}
                        {replies.length > 0 && (
                          <div className="space-y-2.5 pl-3 border-l-2 border-indigo-500/20 ml-2">
                            {replies.map((reply) => {
                              const replyMember = members.find(
                                (m) => m.userId === reply.userId || m.user?.id === reply.userId,
                              );
                              const isReplyAuthorOnline = user?.id === reply.user?.id;

                              return (
                                <div
                                  key={reply.id}
                                  id={`comment-${reply.id}`}
                                  className={cn(
                                    'py-2 px-1 rounded-md transition-all duration-200 group/reply relative',
                                    highlightedCommentId === reply.id
                                      ? 'bg-indigo-500/15 ring-1 ring-indigo-500/50'
                                      : 'hover:bg-zinc-800/20',
                                  )}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <UserAvatar
                                      user={reply.user}
                                      member={replyMember}
                                      size="xs"
                                      showStatus={true}
                                      status={isReplyAuthorOnline ? 'online' : 'offline'}
                                      withHoverCard={true}
                                      workspaceName={workspace?.name}
                                      className="mt-0.5 cursor-pointer"
                                    />

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <ProfileHoverCard
                                          user={reply.user}
                                          member={replyMember}
                                          workspaceName={workspace?.name}
                                          status={isReplyAuthorOnline ? 'online' : 'offline'}
                                        >
                                          <span className="text-xs font-semibold text-foreground hover:underline cursor-pointer">
                                            {reply.user?.name || 'Team Member'}
                                          </span>
                                        </ProfileHoverCard>
                                        <span className="text-[10px] text-zinc-500">
                                          {formatTimeAgo(reply.createdAt)}
                                        </span>
                                        {reply.updatedAt &&
                                          new Date(reply.updatedAt).getTime() - new Date(reply.createdAt).getTime() > 2000 && (
                                            <span className="text-[10px] text-zinc-500 italic">
                                              (edited)
                                            </span>
                                          )}
                                      </div>

                                      {editingCommentId === reply.id ? (
                                        <div className="mt-2 space-y-2">
                                          <textarea
                                            value={editingCommentText}
                                            onChange={(e) => setEditingCommentText(e.target.value)}
                                            rows={2}
                                            className="w-full bg-[#161726] border border-border focus:border-indigo-500 rounded-lg p-2 text-xs text-foreground placeholder:text-zinc-500 focus:outline-none resize-none"
                                          />
                                          <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={handleCancelEditComment}
                                              className="h-6 text-xs px-2"
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="linear"
                                              size="sm"
                                              onClick={() => handleSaveEditComment(reply.id)}
                                              className="h-6 text-xs px-2.5"
                                            >
                                              Save
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="mt-1 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                            {renderCommentContentWithMentions(reply.content, members)}
                                          </div>
                                          <div className="mt-1.5">
                                            <ReactionsBar
                                              reactions={reply.reactions || []}
                                              currentUserId={user?.id}
                                              onToggleReaction={(emoji) => handleToggleCommentReaction(reply.id, emoji)}
                                              size="sm"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Reply Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleStartReply(reply)}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-indigo-300 transition-colors text-[10px]"
                                        title="Reply to this"
                                      >
                                        <CornerDownRight className="w-3 h-3 text-indigo-400" />
                                        <span>Reply</span>
                                      </button>
                                      <button
                                        onClick={() => handleCopyCommentLink(reply.id)}
                                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                        title="Copy link"
                                      >
                                        <Link2 className="w-3 h-3" />
                                      </button>
                                      {(reply.userId === user?.id || workspace?.role === 'OWNER' || workspace?.role === 'ADMIN') && (
                                        <button
                                          onClick={() => handleStartEditComment(reply)}
                                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                          title="Edit reply"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                      )}
                                      {(reply.userId === user?.id || workspace?.role === 'OWNER' || workspace?.role === 'ADMIN') && (
                                        <button
                                          onClick={() => handleDeleteComment(reply.id)}
                                          className="p-1 rounded hover:bg-destructive/20 text-zinc-500 hover:text-destructive transition-all"
                                          title="Delete reply"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Inline "Leave a reply..." Input (Matching user's screenshot with @mention support) */}
                        <div className="relative pt-1">
                          {/* Mentions Autocomplete Floating Dropdown for Replies */}
                          {replyMentionParentId === c.id && replyMentionQuery !== null && matchingReplyMembers.length > 0 && (
                            <div className="absolute bottom-full left-8 mb-2 z-50 w-72 rounded-xl bg-[#191a24] border border-[#2b2c3a] shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95 backdrop-blur-md">
                              <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-zinc-400 border-b border-[#2b2c3a]/70 mb-1">
                                <div className="flex items-center gap-1.5">
                                  <AtSign className="w-3 h-3 text-indigo-400" />
                                  <span>Mention team member</span>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-normal">↑↓ navigate, ↵ select</span>
                              </div>
                              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                {matchingReplyMembers.map((m, idx) => (
                                  <button
                                    key={m.userId}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleSelectReplyMention(c.id, m.user?.name || 'User');
                                    }}
                                    className={cn(
                                      'w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                                      idx === replyMentionIndex
                                        ? 'bg-[#282a38] text-white font-medium'
                                        : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                                    )}
                                  >
                                    <img
                                      src={
                                        m.user?.avatarUrl ||
                                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                          m.user?.name || 'User',
                                        )}`
                                      }
                                      alt={m.user?.name || 'User'}
                                      className="w-5 h-5 rounded-full object-cover shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{m.user?.name || 'User'}</div>
                                      <div className="text-[10px] text-zinc-500 truncate">{m.user?.email}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2.5">
                            <UserAvatar user={user} size="xs" showStatus={false} />
                            <div className="flex-1 flex items-center bg-[#13141f] border border-[#232535] hover:border-zinc-700 focus-within:border-indigo-500/80 rounded-full px-3 py-1 transition-all group">
                              <input
                                type="text"
                                ref={(el) => {
                                  replyInputRefs.current[c.id] = el;
                                }}
                                placeholder="Leave a reply..."
                                value={replyTextMap[c.id] || ''}
                                onChange={(e) => handleReplyTextChange(c.id, e)}
                                onKeyDown={(e) => handleReplyKeyDown(c.id, e)}
                                onBlur={() => {
                                  setTimeout(() => {
                                    if (replyMentionParentId === c.id) {
                                      setReplyMentionParentId(null);
                                      setReplyMentionQuery(null);
                                    }
                                  }, 150);
                                }}
                                disabled={submittingReplyMap[c.id]}
                                className="flex-1 bg-transparent border-0 text-xs text-foreground placeholder:text-zinc-500 focus:outline-none py-0.5"
                              />
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <button
                                  type="button"
                                  onClick={() => handleTriggerReplyMention(c.id)}
                                  className="p-1 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                                  title="Mention someone (@)"
                                >
                                  <AtSign className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  ref={(el) => {
                                    replyFileInputRefs.current[c.id] = el;
                                  }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleReplyImageUpload(c.id, file);
                                    e.target.value = '';
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => replyFileInputRefs.current[c.id]?.click()}
                                  disabled={replyUploadingMap[c.id]}
                                  className="p-1 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                                  title="Attach file/image"
                                >
                                  {replyUploadingMap[c.id] ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                  ) : (
                                    <Paperclip className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSendNestedReply(c.id)}
                                  disabled={!replyTextMap[c.id]?.trim() || submittingReplyMap[c.id]}
                                  className={cn(
                                    'w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0',
                                    replyTextMap[c.id]?.trim()
                                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                                      : 'bg-zinc-800/80 text-zinc-500 hover:text-zinc-300',
                                  )}
                                  title="Send reply"
                                >
                                  {submittingReplyMap[c.id] ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                                  ) : (
                                    <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Collapsed System Activities Toggle (Keeps conversation clean like a chat) */}
          {activities.length > 0 && !isCommentsCollapsed && (
            <div className="pt-2 pb-1">
              <button
                type="button"
                onClick={() => setShowActivities(!showActivities)}
                className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-[11px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-[#13141f] border border-[#1f202b] transition-colors cursor-pointer"
              >
                <History className="w-3 h-3 text-zinc-500" />
                <span>
                  {showActivities
                    ? 'Hide system activity history'
                    : `Show ${activities.length} system activit${activities.length === 1 ? 'y' : 'ies'}`}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform duration-200',
                    showActivities && 'rotate-180'
                  )}
                />
              </button>

              {showActivities && (
                <div className="relative pl-7 space-y-3.5 py-3 mt-2 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[1px] before:bg-[#202232]">
                  {activities.map((act) => {
                    const initials = (act.user?.name || 'User')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div key={act.id} className="relative flex items-center gap-2.5 text-xs text-zinc-300">
                        <div className="absolute -left-7 w-[23px] h-[23px] rounded-full flex items-center justify-center shrink-0 z-10 bg-[#090a0f]">
                          {act.type === 'STATUS_CHANGE' ? (
                            <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30">
                              <Clock className="w-2.5 h-2.5" />
                            </div>
                          ) : act.type === 'ASSIGNEE_CHANGE' ? (
                            <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-sky-500 text-white font-bold text-[8px] ring-1 ring-sky-400/30">
                              {initials}
                            </div>
                          ) : (
                            <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
                              <GitBranch className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>

                        <div className="leading-snug truncate">
                          <span className="font-medium text-zinc-100">{act.user?.name || 'Someone'}</span>{' '}
                          <span className="text-zinc-400">{act.details}</span>{' '}
                          <span className="text-zinc-600">•</span>{' '}
                          <span className="text-zinc-500 text-[11px]">{formatTimeAgo(act.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Comment Composer with Mentions */}
          <div className="relative">
              {/* Mentions Autocomplete Floating Dropdown */}
              {mentionQuery !== null && matchingMembers.length > 0 && (
                <div className="absolute bottom-full left-10 mb-2 z-50 w-72 rounded-xl bg-[#191a24] border border-[#2b2c3a] shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95 backdrop-blur-md">
                  <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-zinc-400 border-b border-[#2b2c3a]/70 mb-1">
                    <div className="flex items-center gap-1.5">
                      <AtSign className="w-3 h-3 text-indigo-400" />
                      <span>Mention team member</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-normal">↑↓ navigate, ↵ select</span>
                  </div>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {matchingMembers.map((m, idx) => (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => handleSelectMention(m.user?.name || 'User')}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                          idx === mentionIndex
                            ? 'bg-[#282a38] text-white font-medium'
                            : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                        )}
                      >
                        <img
                          src={
                            m.user?.avatarUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              m.user?.name || 'User',
                            )}`
                          }
                          alt={m.user?.name || 'User'}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1 truncate">
                          <div className="font-medium text-white truncate text-xs">
                            {m.user?.name}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate">
                            {m.user?.email}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form
                onSubmit={handleAddComment}
                className="rounded-lg bg-[#121318] border border-[#22242c] p-3 focus-within:border-[#383b47] transition-colors"
              >
                {/* Replying banner */}
                {replyingTo && (
                  <div className="flex items-center justify-between px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded text-xs text-indigo-300 mb-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <CornerDownRight className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="font-semibold text-white truncate">Replying to @{replyingTo.authorName}:</span>
                      <span className="text-zinc-400 truncate text-[11px]">&ldquo;{replyingTo.contentPreview.slice(0, 50)}...&rdquo;</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="p-0.5 hover:bg-indigo-500/20 rounded text-zinc-400 hover:text-white transition-colors ml-2 shrink-0"
                      title="Cancel reply"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <textarea
                  ref={commentTextareaRef}
                  value={newCommentText}
                  onChange={handleCommentTextChange}
                  onKeyDown={handleCommentKeyDown}
                  onPaste={(e) =>
                    handlePasteToTextarea(
                      e,
                      newCommentText,
                      setNewCommentText,
                      undefined,
                      setIsUploadingCommentImage,
                    )
                  }
                  onDrop={(e) =>
                    handleDropToTextarea(
                      e,
                      newCommentText,
                      setNewCommentText,
                      undefined,
                      setIsUploadingCommentImage,
                    )
                  }
                  onDragOver={(e) => e.preventDefault()}
                  rows={2}
                  placeholder={
                    replyingTo
                      ? `Write a reply to @${replyingTo.authorName}...`
                      : "Leave a comment..."
                  }
                  className="w-full bg-transparent border-0 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed min-h-[44px]"
                />

                {/* Comment image live preview */}
                {newCommentText && newCommentText.includes('![') && (
                  <div className="p-2 border-t border-border/30 bg-[#0a0b12]/50 my-1 rounded">
                    <MarkdownRenderer
                      content={
                        newCommentText
                          .split('\n')
                          .filter((l) => l.trim().startsWith('!['))
                          .join('\n')
                      }
                      membersList={members}
                      onImageClick={(url) => setLightboxUrl(url)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 mt-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      ref={mainCommentFileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadImageFile(file, commentTextareaRef.current, newCommentText, setNewCommentText, undefined, setIsUploadingCommentImage);
                        }
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => mainCommentFileInputRef.current?.click()}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                      title="Attach file/image"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const text = newCommentText ? `${newCommentText} @` : '@';
                        setNewCommentText(text);
                        setMentionQuery('');
                        setMentionCursorPos(text.length - 1);
                        setMentionIndex(0);
                        setTimeout(() => {
                          if (commentTextareaRef.current) {
                            commentTextareaRef.current.focus();
                            commentTextareaRef.current.setSelectionRange(text.length, text.length);
                          }
                        }, 10);
                      }}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                      title="Mention a team member (@)"
                    >
                      <AtSign className="w-3.5 h-3.5" />
                    </button>

                    {isUploadingCommentImage && (
                      <span className="flex items-center gap-1 text-[11px] text-indigo-400 font-medium animate-pulse ml-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading...</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.triageStatus === 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => handleResubmitRequest(newCommentText.trim())}
                        disabled={isResubmitting || !newCommentText.trim()}
                        className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer disabled:opacity-40"
                        title="Send comment and resubmit request to Triage"
                      >
                        {isResubmitting ? (
                          <Loader2 className="w-3 h-3 animate-spin text-white" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        <span>Reply & Resubmit</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={!newCommentText.trim() || submittingComment}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white shadow-sm shrink-0"
                      title="Send comment (Cmd + Enter)"
                    >
                      {submittingComment ? (
                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                      ) : (
                        <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Properties Sidebar (Exact layout matching Linear screenshot) */}
        <div className="w-full lg:w-64 space-y-5 shrink-0 select-none pt-1">
          {/* Section 1: Properties */}
          <div>
            <div className="text-xs text-zinc-500 font-medium mb-1 px-1">
              Properties
            </div>

            <div className="space-y-0.5 text-xs">
              {/* Status Row */}
              <div className="property-dropdown-container relative">
                <button
                  type="button"
                  disabled={workspace?.role === 'STAKEHOLDER'}
                  onClick={() => {
                    if (workspace?.role === 'STAKEHOLDER') return;
                    setActiveDropdown(activeDropdown === 'status' ? null : 'status');
                  }}
                  className={cn(
                    "w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1a1b26] transition-colors text-left",
                    workspace?.role === 'STAKEHOLDER' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer group'
                  )}
                >
                  {(() => {
                    const currentCustomSection = customStatus
                      ? sections.find((s) => s.key === customStatus)
                      : null;
                    return (
                      <div className="flex items-center gap-2.5">
                        <StatusIcon
                          status={currentCustomSection ? currentCustomSection.name : status}
                          color={currentCustomSection?.color}
                        />
                        <span className="text-zinc-200 font-medium group-hover:text-white truncate">
                          {currentCustomSection
                            ? currentCustomSection.name
                            : STATUS_CONFIG[status]?.label || status}
                        </span>
                      </div>
                    );
                  })()}
                </button>

                {activeDropdown === 'status' && (
                  <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100 max-h-80 overflow-y-auto">
                    <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                      <span>Change status...</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60">
                        S
                      </kbd>
                    </div>
                    {[
                      { s: 'BACKLOG' as TaskStatus, label: 'Backlog', shortcut: '1' },
                      { s: 'TODO' as TaskStatus, label: 'Todo', shortcut: '2' },
                      { s: 'IN_PROGRESS' as TaskStatus, label: 'In Progress', shortcut: '3' },
                      { s: 'DONE' as TaskStatus, label: 'Done', shortcut: '4' },
                      { s: 'CANCELED' as TaskStatus, label: 'Canceled', shortcut: '5' },
                    ].map((item) => (
                      <button
                        key={item.s}
                        onClick={() => handleStatusChange(item.s, null)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                          item.s === status && !customStatus
                            ? 'bg-[#282a38] text-white font-medium'
                            : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <StatusIcon status={item.s} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.s === status && !customStatus && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                          <span className="text-[11px] font-mono text-zinc-500">{item.shortcut}</span>
                        </div>
                      </button>
                    ))}

                    {sections.length > 0 && (
                      <>
                        <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-zinc-500 border-t border-[#2b2c3a]/70 mt-1 pt-1.5">
                          Custom Sections
                        </div>
                        {sections.map((sec) => (
                          <button
                            key={sec.id}
                            onClick={() => handleStatusChange(sec.category || 'IN_PROGRESS', sec.key)}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                              customStatus === sec.key
                                ? 'bg-[#282a38] text-white font-medium'
                                : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <StatusIcon status={sec.name} color={sec.color} />
                              <span className="truncate">{sec.name}</span>
                            </div>
                            {customStatus === sec.key && (
                              <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Workspace / Team Info (Matching Linear: [T] Tjar) */}
              <div className="py-1.5 px-2 flex items-center gap-2.5 rounded-md text-zinc-300">
                {workspace?.logoUrl ? (
                  <img
                    src={resolveMediaUrl(workspace.logoUrl)}
                    alt={workspace?.name || 'Workspace'}
                    className="w-4 h-4 rounded object-cover shrink-0"
                  />
                ) : (
                  <span className="w-4 h-4 rounded bg-[#5e6ad2] text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                    {workspace?.name?.[0] || 'T'}
                  </span>
                )}
                <span className="font-medium text-zinc-300 truncate">
                  {workspace?.name || 'Workspace'}
                </span>
              </div>

              {/* Priority Row (Matching Linear: [PriorityIcon] High) */}
              <div className="property-dropdown-container relative">
                <button
                  type="button"
                  disabled={workspace?.role === 'STAKEHOLDER'}
                  onClick={() => {
                    if (workspace?.role === 'STAKEHOLDER') return;
                    setActiveDropdown(activeDropdown === 'priority' ? null : 'priority');
                  }}
                  className={cn(
                    "w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1a1b26] transition-colors text-left",
                    workspace?.role === 'STAKEHOLDER' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer group'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <PriorityIcon priority={priority} />
                    <span className="text-zinc-300 font-medium group-hover:text-white">
                      {priority === 'NO_PRIORITY' ? '··· Set priority' : PRIORITY_CONFIG[priority].label}
                    </span>
                  </div>
                </button>

                {activeDropdown === 'priority' && (
                  <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                      <span>Set priority to...</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60">
                        P
                      </kbd>
                    </div>
                    {[
                      { p: 'NO_PRIORITY' as TaskPriority, label: 'No priority', shortcut: '0' },
                      { p: 'URGENT' as TaskPriority, label: 'Urgent', shortcut: '1' },
                      { p: 'HIGH' as TaskPriority, label: 'High', shortcut: '2' },
                      { p: 'MEDIUM' as TaskPriority, label: 'Medium', shortcut: '3' },
                      { p: 'LOW' as TaskPriority, label: 'Low', shortcut: '4' },
                    ].map((item) => (
                      <button
                        key={item.p}
                        onClick={() => handlePriorityChange(item.p)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                          item.p === priority
                            ? 'bg-[#282a38] text-white font-medium'
                            : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PriorityIcon priority={item.p} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.p === priority && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                          <span className="text-[11px] font-mono text-zinc-500">{item.shortcut}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignee Row (Matching Linear: [Avatar] Muhammad Fiqri Ananda Hakin) */}
              <div className="property-dropdown-container relative">
                <button
                  type="button"
                  disabled={workspace?.role === 'STAKEHOLDER'}
                  onClick={() => {
                    if (workspace?.role === 'STAKEHOLDER') return;
                    setActiveDropdown(activeDropdown === 'assignee' ? null : 'assignee');
                  }}
                  className={cn(
                    "w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1a1b26] transition-colors text-left",
                    workspace?.role === 'STAKEHOLDER' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer group'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {currentAssignee ? (
                      <>
                        <img
                          src={
                            currentAssignee.avatarUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              currentAssignee.name,
                            )}`
                          }
                          alt=""
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="text-zinc-300 font-medium group-hover:text-white truncate">
                          {currentAssignee.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-500">··· Assign</span>
                      </>
                    )}
                  </div>
                </button>

                {activeDropdown === 'assignee' && (
                  <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                      <span>Assign to...</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60">
                        A
                      </kbd>
                    </div>
                    <button
                      onClick={() => handleAssigneeChange(null)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                        assigneeId === null
                          ? 'bg-[#282a38] text-white font-medium'
                          : 'text-zinc-400 hover:bg-[#232432] hover:text-white',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Unassigned</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {assigneeId === null && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                        <span className="text-[11px] font-mono text-zinc-500">-</span>
                      </div>
                    </button>
                    {members.map((m, idx) => (
                      <button
                        key={m.userId}
                        onClick={() => handleAssigneeChange(m.userId)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                          m.userId === assigneeId
                            ? 'bg-[#282a38] text-white font-medium'
                            : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          <img
                            src={
                              m.user.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                m.user.name,
                              )}`
                            }
                            alt=""
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                          <span className="truncate">{m.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {m.userId === assigneeId && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                          <span className="text-[11px] font-mono text-zinc-500">{idx + 1}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Requesting Division Property Row (Clean Linear row if present) */}
              {task.requesterDivision && (
                <div className="py-1.5 px-2 flex items-center justify-between rounded-md hover:bg-[#1a1b26] transition-colors text-xs">
                  <div className="flex items-center gap-2.5 text-zinc-300 truncate">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{task.requesterDivision.name}</span>
                  </div>
                  {task.triageStatus && (
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full border shrink-0',
                        task.triageStatus === 'INBOX_PENDING' && 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                        task.triageStatus === 'APPROVED_BACKLOG' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                        task.triageStatus === 'REJECTED' && 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                      )}
                    >
                      {task.triageStatus === 'INBOX_PENDING' ? 'Pending' : task.triageStatus === 'APPROVED_BACKLOG' ? 'Approved' : 'Rejected'}
                    </span>
                  )}
                </div>
              )}

              {/* Due Date Property Row */}
              <div className="property-dropdown-container relative">
                <label className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                    <span className={cn("truncate", dueDate ? "text-zinc-300 group-hover:text-white" : "text-zinc-500")}>
                      {dueDate ? new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '··· Set due date'}
                    </span>
                  </div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>

              {/* Cycle (Sprint) Property Row */}
              {workspace?.cyclesEnabled !== false && (
                <div className="property-dropdown-container relative">
                  {(() => {
                    const activeCycleObj = cycles.find((c) => c.id === cycleId) || task.cycle;
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(activeDropdown === 'cycle' ? null : 'cycle')}
                          className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-zinc-300 font-medium group-hover:text-white truncate">
                              {activeCycleObj?.name || '··· Cycle'}
                            </span>
                          </div>
                        </button>

                        {activeDropdown === 'cycle' && (
                          <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                            <div className="px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                              Select Cycle (Sprint)...
                            </div>
                            <button
                              onClick={() => handleCycleChange(null)}
                              className={cn(
                                'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                                cycleId === null
                                  ? 'bg-[#282a38] text-white font-medium'
                                  : 'text-zinc-400 hover:bg-[#232432] hover:text-white',
                              )}
                            >
                              <span>No Cycle</span>
                              {cycleId === null && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                            </button>
                            {cycles.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => handleCycleChange(c.id)}
                                className={cn(
                                  'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                                  c.id === cycleId
                                    ? 'bg-[#282a38] text-white font-medium'
                                    : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                                )}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      c.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-indigo-400'
                                    }`}
                                  />
                                  <span className="truncate">{c.name}</span>
                                </div>
                                {c.id === cycleId && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Estimate (Story Points) Property Row */}
              <div className="property-dropdown-container relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'estimate' ? null : 'estimate')}
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-zinc-300 font-medium group-hover:text-white">
                      {estimate ? `${estimate} points` : '··· Estimate'}
                    </span>
                  </div>
                </button>

                {activeDropdown === 'estimate' && (
                  <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                      Story Points Estimate
                    </div>
                    {[
                      { pts: 1, label: '1 point (Small)' },
                      { pts: 2, label: '2 points' },
                      { pts: 3, label: '3 points (Medium)' },
                      { pts: 5, label: '5 points (Large)' },
                      { pts: 8, label: '8 points (XL)' },
                      { pts: 13, label: '13 points (Epic)' },
                    ].map((item) => (
                      <button
                        key={item.pts}
                        onClick={() => handleEstimateChange(item.pts)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                          estimate === item.pts
                            ? 'bg-[#282a38] text-white font-medium'
                            : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                        )}
                      >
                        <span>{item.label}</span>
                        {estimate === item.pts && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Parent Issue Row */}
              <div className="property-dropdown-container relative">
                {task.parent ? (
                  <div className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1a1b26] transition-colors text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      <GitFork className="w-3.5 h-3.5 text-indigo-400 rotate-180 shrink-0" />
                      <Link
                        href={`/issue/${task.parent.id}`}
                        className="text-zinc-300 hover:text-white truncate font-medium"
                        title={task.parent.title}
                      >
                        <span className="font-mono text-zinc-500 mr-1.5">{task.parent.identifier}</span>
                        <span>{task.parent.title}</span>
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await api.tasks.update(task.id, { parentId: null });
                        setTask((prev) => (prev ? { ...prev, parentId: null, parent: null } : null));
                      }}
                      className="p-1 rounded hover:bg-rose-500/15 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Unlink parent"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowParentPicker(!showParentPicker)}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-2.5 text-zinc-500 group-hover:text-zinc-300">
                        <GitFork className="w-3.5 h-3.5 rotate-180" />
                        <span>··· Set parent issue</span>
                      </div>
                    </button>

                    {showParentPicker && (
                      <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-2" />
                          <input
                            type="text"
                            autoFocus
                            value={parentSearch}
                            onChange={(e) => setParentSearch(e.target.value)}
                            placeholder="Search parent issue..."
                            className="w-full bg-[#12131d] text-xs text-white placeholder:text-zinc-500 pl-7 pr-2.5 py-1 rounded border border-[#2b2c3a] focus:outline-none"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {allTasks
                            .filter(
                              (t) =>
                                t.id !== task.id &&
                                t.parentId !== task.id &&
                                (parentSearch.trim() === '' ||
                                  t.title.toLowerCase().includes(parentSearch.toLowerCase()) ||
                                  t.identifier.toLowerCase().includes(parentSearch.toLowerCase())),
                            )
                            .slice(0, 5)
                            .map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={async () => {
                                  await api.tasks.update(task.id, { parentId: t.id });
                                  setTask((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          parentId: t.id,
                                          parent: {
                                            id: t.id,
                                            identifier: t.identifier,
                                            title: t.title,
                                            status: t.status,
                                          },
                                        }
                                      : null,
                                  );
                                  setShowParentPicker(false);
                                  setParentSearch('');
                                }}
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#20212f] text-left text-xs text-zinc-300 hover:text-white transition-colors"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                                  <span className="font-mono text-[11px] text-zinc-400">{t.identifier}</span>
                                  <span className="truncate">{t.title}</span>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Labels (matching Linear screenshot) */}
          <div className="pt-3 border-t border-[#1f202b] property-dropdown-container relative">
            <div className="text-xs text-zinc-500 font-medium mb-1.5 px-1">
              Labels
            </div>

            {/* Attached Labels List & Add button */}
            <div className="flex flex-wrap items-center gap-1.5 px-1">
              {labels.map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-[#1a1b28] text-zinc-200 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getLabelColor(lbl) }}
                  />
                  <span>{lbl}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(lbl)}
                    className="hover:text-rose-400 text-zinc-500 transition-colors ml-0.5"
                    title="Remove label"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={() => {
                  setActiveDropdown(activeDropdown === 'labels' ? null : 'labels');
                  setLabelSearch('');
                }}
                className="inline-flex items-center gap-1.5 py-1 px-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1b26] transition-colors cursor-pointer"
                title="Add label (L)"
              >
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                <span>Add label</span>
              </button>
            </div>

            {/* Linear Labels Dropdown Menu with Search */}
            {activeDropdown === 'labels' && (
              <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100 max-h-72 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[#2b2c3a]/70 mb-1">
                  <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Filter or create label..."
                    value={labelSearch}
                    onChange={(e) => setLabelSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && labelSearch.trim()) {
                        e.preventDefault();
                        handleCreateLabel(labelSearch.trim());
                      }
                    }}
                    autoFocus
                    className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60 shrink-0">
                    L
                  </kbd>
                </div>

                <div className="overflow-y-auto space-y-0.5 max-h-48 py-0.5 pr-0.5">
                  {filteredLabels.map((lbl) => {
                    const isSelected = labels.includes(lbl);
                    return (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => handleToggleLabel(lbl)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                          isSelected
                            ? 'bg-[#282a38] text-white font-medium'
                            : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getLabelColor(lbl) }}
                          />
                          <span className="truncate">{lbl}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[2.5] shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}

                  {filteredLabels.length === 0 && !labelSearch.trim() && (
                    <div className="px-2.5 py-3 text-center text-xs text-zinc-500">
                      No labels found
                    </div>
                  )}
                </div>

                {labelSearch.trim() &&
                  !allWorkspaceLabels.some(
                    (l) => l.toLowerCase() === labelSearch.trim().toLowerCase(),
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleCreateLabel(labelSearch.trim())}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-primary hover:bg-primary/10 transition-colors font-medium border-t border-[#2b2c3a]/50 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Create label &ldquo;{labelSearch.trim()}&rdquo;</span>
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* Section 3: Project (matching Linear screenshot) */}
          <div className="space-y-1.5 pt-3 border-t border-[#1f202b] property-dropdown-container relative">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-medium px-1">
              <span>Project</span>
              {activeProject && (
                <button
                  type="button"
                  onClick={() => {
                    setNewPrefix(activeProject.key);
                    setShowPrefixModal(true);
                  }}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  title="Change project prefix key (e.g. TJAR)"
                >
                  <span className="font-bold">{activeProject.key}</span>
                  <Edit3 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'project' ? null : 'project')}
              className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#1a1b26] transition-colors cursor-pointer group text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Target className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                <span className={cn("font-medium group-hover:text-white truncate", activeProject ? "text-zinc-300" : "text-zinc-500")}>
                  {activeProject?.name || '+ Add to project'}
                </span>
              </div>
            </button>

            {activeDropdown === 'project' && (
              <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl border border-[#2b2c3a] bg-[#191a24] shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 font-normal border-b border-[#2b2c3a]/70 mb-1">
                  <span>Move to project...</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60">
                    M
                  </kbd>
                </div>
                {projects.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => handleProjectChange(p.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                      p.id === projectId
                        ? 'bg-[#282a38] text-white font-medium'
                        : 'text-zinc-300 hover:bg-[#232432] hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || '#5e6ad2' }}
                      />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {p.id === projectId && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                      <span className="text-[10px] font-mono text-zinc-500">{idx + 1}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Creator Info */}
          <div className="pt-4 border-t border-border/40 text-xs space-y-1">
            <span className="text-[11px] text-zinc-500 font-medium block">Created by</span>
            <ProfileHoverCard
              user={task.creator}
              member={members.find(
                (m) => m.userId === task.creatorId || m.user?.id === task.creator?.id,
              )}
              workspaceName={workspace?.name}
              status={user?.id === task.creator?.id ? 'online' : 'offline'}
              className="block"
            >
              <div className="flex items-center gap-2 pt-0.5 cursor-pointer group/creator">
                <UserAvatar
                  user={task.creator}
                  size="xs"
                  showStatus={false}
                />
                <span className="text-zinc-300 font-medium group-hover/creator:text-white transition-colors">
                  {task.creator?.name || 'Alex Vance'}
                </span>
              </div>
            </ProfileHoverCard>
            <span className="text-[10px] text-zinc-500 block pt-0.5">
              {new Date(task.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Subscribers Section */}
          <div className="pt-4 border-t border-border/50 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 font-medium text-[11px]">
                <Bell className="w-3.5 h-3.5 text-indigo-400" />
                <span>Subscribers ({subscribers.length})</span>
              </div>
              <button
                type="button"
                onClick={handleToggleSubscribe}
                disabled={isSubscribing}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
              >
                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {subscribers.length === 0 ? (
                <span className="text-[11px] text-zinc-500">No subscribers yet</span>
              ) : (
                subscribers.map((sub) => (
                  <ProfileHoverCard
                    key={sub.id || sub.userId}
                    user={sub.user}
                    workspaceName={workspace?.name}
                    status={user?.id === sub.user?.id ? 'online' : 'offline'}
                  >
                    <div className="cursor-pointer" title={sub.user?.name || sub.user?.email}>
                      <UserAvatar user={sub.user} size="xs" showStatus={false} />
                    </div>
                  </ProfileHoverCard>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal to Change Issue Prefix / Project Key */}
      {showPrefixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowPrefixModal(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-[#2b2c3a] bg-[#12131d] shadow-2xl p-5 space-y-4 z-10 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Change Issue Prefix Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrefixModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePrefix} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-medium">
                  Prefix Key (e.g. TJAR, LIN, PROJ)
                </label>
                <input
                  type="text"
                  value={newPrefix}
                  onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. TJAR"
                  maxLength={10}
                  autoFocus
                  className="w-full bg-[#181926] border border-[#2b2c3a] rounded-lg px-3 py-2 text-sm text-white font-mono uppercase tracking-wider focus:outline-none focus:border-primary"
                  required
                />
                <p className="text-[11px] text-zinc-500 leading-normal">
                  All current issues under this project will automatically be renamed to this prefix (e.g.{' '}
                  <span className="font-mono text-indigo-300">{newPrefix.trim().toUpperCase() || 'TJAR'}-1</span>
                  ), and newly created issues will increment automatically ({newPrefix.trim().toUpperCase() || 'TJAR'}-2, etc.).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrefixModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="linear"
                  size="sm"
                  disabled={!newPrefix.trim() || updatingPrefix}
                  className="text-xs px-3"
                >
                  {updatingPrefix ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                  Save Prefix
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] bg-[#0f1018] border border-border/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-[#141522]">
              <span className="text-xs font-medium text-zinc-300 truncate max-w-md">
                Image Preview
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs flex items-center gap-1"
                  title="Open original"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Original</span>
                </a>
                <button
                  onClick={() => setLightboxUrl(null)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 sm:p-4 overflow-auto flex items-center justify-center bg-[#07080d]">
              <img
                src={lightboxUrl}
                alt="Enlarged preview"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IssuePage() {
  return (
    <AuthProvider>
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        <IssueDetailContent />
      </React.Suspense>
    </AuthProvider>
  );
}
