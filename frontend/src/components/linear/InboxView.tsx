'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  InboxNotification,
  Task,
  TaskComment,
  TaskStatus,
  TaskPriority,
  WorkspaceMember,
} from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Inbox,
  AtSign,
  UserCheck,
  CheckCheck,
  Trash2,
  Check,
  Loader2,
  ExternalLink,
  Bell,
  BellOff,
  MessageSquare,
  Building2,
  X,
  Mail,
  Activity,
  Star,
  Link2,
  GitBranch,
  MoreHorizontal,
  Smile,
  Paperclip,
  ArrowUp,
  Plus,
  ArrowLeft,
  Menu,
  ChevronDown,
  SlidersHorizontal,
  Tag,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { StatusIcon } from './StatusIcon';
import { PriorityIcon } from './PriorityIcon';
import { MarkdownRenderer, resolveMediaUrl } from '../ui/MarkdownRenderer';
import { LinearRichEditor } from './LinearRichEditor';

interface InboxViewProps {
  onUnreadCountChange?: (count: number) => void;
  onOpenMobileNav?: () => void;
}

export function InboxView({ onUnreadCountChange, onOpenMobileNav }: InboxViewProps) {
  const router = useRouter();
  const { user, workspace, workspaces, refreshWorkspacesAndProjects, setWorkspace } = useAuth();

  // Root container ref for horizontal resizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [listWidth, setListWidth] = useState<number>(340);
  const [isResizing, setIsResizing] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions' | 'assigned'>('all');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);

  // Selected Task State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(false);

  // Inline Task Editing State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskLabels, setTaskLabels] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Tag / Label Picker State
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');

  // Sub-issue creation state
  const [addingSubIssue, setAddingSubIssue] = useState(false);
  const [subIssueTitle, setSubIssueTitle] = useState('');
  const [creatingSubIssue, setCreatingSubIssue] = useState(false);

  // Comments State
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [reactionPopoverCommentId, setReactionPopoverCommentId] = useState<string | null>(null);

  // Mention Tagging State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionCursorPos, setMentionCursorPos] = useState<number>(-1);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Properties Dropdowns State
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Mobile detail view toggle
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Load saved width from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('linear_inbox_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 260 && val <= 650) {
          setListWidth(val);
        }
      }
    }
  }, []);

  // Horizontal Resize Handlers
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      if (newWidth >= 260 && newWidth <= Math.min(650, window.innerWidth - 340)) {
        setListWidth(newWidth);
        try {
          localStorage.setItem('linear_inbox_width', String(newWidth));
        } catch {}
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Fetch notifications
  const fetchInbox = useCallback(async () => {
    try {
      const res = await api.inbox.get();
      const list = res.notifications || [];
      setNotifications(list);
      setUnreadCount(res.unreadCount || 0);
      if (onUnreadCountChange) {
        onUnreadCountChange(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load inbox:', err);
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'mentions') return n.type === 'MENTIONED';
    if (filter === 'assigned') return n.type === 'ASSIGNED';
    return true;
  });

  // Automatically select first notification
  useEffect(() => {
    if (filteredNotifications.length > 0 && !selectedNotifId) {
      handleSelectNotification(filteredNotifications[0]);
    }
  }, [filteredNotifications, selectedNotifId]);

  // Load task details when notification is selected
  const handleSelectNotification = async (notif: InboxNotification) => {
    setSelectedNotifId(notif.id);
    setMobileShowDetail(true);

    if (!notif.isRead) {
      try {
        await api.inbox.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
        );
        setUnreadCount((prev) => {
          const next = Math.max(0, prev - 1);
          if (onUnreadCountChange) onUnreadCountChange(next);
          return next;
        });
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    if (notif.taskId) {
      setTaskLoading(true);
      try {
        const task = await api.tasks.getById(notif.taskId);
        setSelectedTask(task);
        setTaskTitle(task.title || '');
        setTaskDesc(task.description || '');
        setTaskLabels(task.labels || []);
        setIsActivitiesExpanded(false);
        if (user && task.subscribers) {
          setIsSubscribed(task.subscribers.some((s: any) => s.userId === user.id));
        }
      } catch (err) {
        console.error('Failed to load task details:', err);
        setSelectedTask(null);
      } finally {
        setTaskLoading(false);
      }
    } else {
      setSelectedTask(null);
    }
  };

  // Save Task Updates Helper
  const saveTaskUpdates = async (
    updates: Partial<{
      title: string;
      description: string;
      labels: string[];
      status: TaskStatus;
      priority: TaskPriority;
      assigneeId: string | null;
    }>,
  ) => {
    if (!selectedTask) return;
    setSaveStatus('saving');
    try {
      const updated = await api.tasks.update(selectedTask.id, updates);
      setSelectedTask((prev) => (prev ? { ...prev, ...updated } : null));

      // Sync notification list on left
      if (updates.title) {
        setNotifications((prev) =>
          prev.map((n) => (n.taskId === selectedTask.id && n.task ? { ...n, task: { ...n.task, title: updates.title! } } : n)),
        );
      }
      if (updates.status) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.taskId === selectedTask.id && n.task ? { ...n, task: { ...n.task, status: updates.status! } } : n,
          ),
        );
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1400);
    } catch (err) {
      console.error('Failed to save task updates:', err);
      setSaveStatus('idle');
    }
  };

  // Label Tagging Logic
  const allWorkspaceLabels = useMemo(() => {
    const defaultLabels = [
      'Bug',
      'Feature',
      'Improvement',
      'Design',
      'Frontend',
      'Backend',
      'Performance',
      'Critical',
      'Docs',
    ];
    const set = new Set<string>(defaultLabels);
    taskLabels.forEach((l) => set.add(l));
    return Array.from(set);
  }, [taskLabels]);

  const filteredLabels = useMemo(() => {
    if (!labelSearch.trim()) return allWorkspaceLabels;
    const q = labelSearch.toLowerCase();
    return allWorkspaceLabels.filter((lbl) => lbl.toLowerCase().includes(q));
  }, [allWorkspaceLabels, labelSearch]);

  const handleToggleLabel = (lbl: string) => {
    const updated = taskLabels.includes(lbl) ? taskLabels.filter((l) => l !== lbl) : [...taskLabels, lbl];
    setTaskLabels(updated);
    saveTaskUpdates({ labels: updated });
  };

  const handleCreateLabel = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!taskLabels.includes(trimmed)) {
      const updated = [...taskLabels, trimmed];
      setTaskLabels(updated);
      saveTaskUpdates({ labels: updated });
    }
    setLabelSearch('');
  };

  // Create Sub-issue Logic
  const handleCreateSubIssue = async () => {
    if (!selectedTask || !subIssueTitle.trim()) return;
    setCreatingSubIssue(true);
    try {
      const newSub = await api.tasks.createSubTask(selectedTask.id, {
        title: subIssueTitle.trim(),
        projectId: selectedTask.projectId,
      });
      setSelectedTask((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          subTasks: [...(prev.subTasks || []), newSub],
        };
      });
      setSubIssueTitle('');
      setAddingSubIssue(false);
    } catch (err) {
      console.error('Failed to create sub-issue:', err);
    } finally {
      setCreatingSubIssue(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.inbox.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleAcceptInvite = async (notif: InboxNotification) => {
    const tokenOrId = notif.invitation?.token || notif.invitationId || notif.id;
    if (!tokenOrId) return;

    try {
      setActionLoadingId(notif.id);
      const res = await api.invitations.accept(tokenOrId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? {
                ...n,
                isRead: true,
                invitation: n.invitation ? { ...n.invitation, status: 'ACCEPTED' } : undefined,
              }
            : n,
        ),
      );
      await refreshWorkspacesAndProjects();
      if (res.workspace) {
        setWorkspace(res.workspace);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineInvite = async (notif: InboxNotification) => {
    const tokenOrId = notif.invitation?.token || notif.invitationId || notif.id;
    if (!tokenOrId) return;

    try {
      setActionLoadingId(notif.id);
      await api.invitations.decline(tokenOrId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? {
                ...n,
                isRead: true,
                invitation: n.invitation ? { ...n.invitation, status: 'DECLINED' } : undefined,
              }
            : n,
        ),
      );
    } catch (err: any) {
      alert(err.message || 'Failed to decline invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Comment Mention Tagging Input Handler
  const handleCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    setCommentText(text);

    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    if (lastAt !== -1) {
      const charBeforeAt = lastAt > 0 ? textBeforeCursor[lastAt - 1] : ' ';
      const query = textBeforeCursor.slice(lastAt + 1);
      if ([' ', '\n', '\t'].includes(charBeforeAt) && !query.includes(' ') && !query.includes('\n')) {
        setMentionQuery(query);
        setMentionCursorPos(lastAt);
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleSelectMention = (memberName: string) => {
    if (mentionCursorPos === -1) return;
    const before = commentText.slice(0, mentionCursorPos);
    const after = commentText.slice(mentionCursorPos + 1 + (mentionQuery?.length || 0));
    const next = `${before}@${memberName} ${after}`;
    setCommentText(next);
    setMentionQuery(null);
    if (commentTextareaRef.current) {
      commentTextareaRef.current.focus();
    }
  };

  const matchingMembers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    const list = workspace?.members || [];
    return list
      .filter(
        (m) =>
          (m.user?.name || '').toLowerCase().includes(q) ||
          (m.user?.email || '').toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [mentionQuery, workspace?.members]);

  // Add Comment
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;

    setSubmittingComment(true);
    try {
      const newComment = await api.tasks.addComment(selectedTask.id, commentText.trim());
      setSelectedTask((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...(prev.comments || []), newComment],
        };
      });
      setCommentText('');
      setMentionQuery(null);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Add Nested Reply
  const handleAddReply = async (commentId: string) => {
    if (!replyText.trim() || !selectedTask) return;

    setSubmittingReply(true);
    try {
      const newReply = await api.tasks.addComment(selectedTask.id, replyText.trim(), commentId);
      setSelectedTask((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: (prev.comments || []).map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newReply],
              };
            }
            return c;
          }),
        };
      });
      setReplyText('');
      setReplyingCommentId(null);
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Edit Comment
  const handleSaveEditComment = async (commentId: string) => {
    if (!editingCommentText.trim() || isUpdatingComment || !selectedTask) return;
    setIsUpdatingComment(true);
    try {
      const updated = await api.tasks.updateComment(selectedTask.id, commentId, editingCommentText.trim());
      setSelectedTask((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: (prev.comments || []).map((c) => (c.id === commentId ? { ...c, content: updated.content } : c)),
        };
      });
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      console.error('Failed to update comment:', err);
    } finally {
      setIsUpdatingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTask) return;
    const ok = window.confirm('Delete this comment?');
    if (!ok) return;

    setSelectedTask((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        comments: (prev.comments || []).filter((c) => c.id !== commentId),
      };
    });
    try {
      await api.tasks.deleteComment(selectedTask.id, commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Toggle Reaction
  const handleToggleReaction = async (commentId: string, emoji: string) => {
    if (!selectedTask) return;
    try {
      const res = await api.tasks.toggleCommentReaction(selectedTask.id, commentId, emoji);
      setSelectedTask((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: (prev.comments || []).map((c) => {
            if (c.id === commentId) {
              const currentReactions = c.reactions || [];
              if (res.action === 'added' && res.reaction) {
                return { ...c, reactions: [...currentReactions, res.reaction] };
              } else {
                return {
                  ...c,
                  reactions: currentReactions.filter(
                    (r) => !(r.commentId === commentId && r.userId === res.userId && r.emoji === emoji),
                  ),
                };
              }
            }
            return c;
          }),
        };
      });
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    } finally {
      setReactionPopoverCommentId(null);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!selectedTask) return;
    try {
      if (isSubscribed) {
        await api.tasks.unsubscribe(selectedTask.id);
        setIsSubscribed(false);
      } else {
        await api.tasks.subscribe(selectedTask.id);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Failed to toggle subscribe:', err);
    }
  };

  const handleCopyLink = () => {
    if (!selectedTask) return;
    const url = `${window.location.origin}/issue/${selectedTask.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTask) return;

    setIsUploadingFile(true);
    try {
      const attachment = await api.uploads.upload(file, selectedTask.id);
      setSelectedTask((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          attachments: [...(prev.attachments || []), attachment],
        };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    return `${months}mo`;
  };

  const renderNotificationBadge = (type: string) => {
    switch (type) {
      case 'MENTIONED':
        return (
          <div className="w-3 h-3 rounded-full bg-indigo-500 text-white flex items-center justify-center ring-2 ring-[#0b0c13]">
            <AtSign className="w-2 h-2 stroke-[3]" />
          </div>
        );
      case 'ASSIGNED':
        return (
          <div className="w-3 h-3 rounded-full bg-sky-500 text-white flex items-center justify-center ring-2 ring-[#0b0c13]">
            <UserCheck className="w-2 h-2 stroke-[3]" />
          </div>
        );
      case 'COMMENT_REPLY':
        return (
          <div className="w-3 h-3 rounded-full bg-cyan-500 text-white flex items-center justify-center ring-2 ring-[#0b0c13]">
            <MessageSquare className="w-2 h-2 stroke-[3]" />
          </div>
        );
      case 'WORKSPACE_INVITATION':
        return (
          <div className="w-3 h-3 rounded-full bg-purple-500 text-white flex items-center justify-center ring-2 ring-[#0b0c13]">
            <Building2 className="w-2 h-2 stroke-[3]" />
          </div>
        );
      case 'TASK_UPDATE':
      default:
        return (
          <div className="w-3 h-3 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-[#0b0c13]">
            <Activity className="w-2 h-2 stroke-[3]" />
          </div>
        );
    }
  };

  const renderNotificationSnippet = (notif: InboxNotification) => {
    const actorName = notif.actor?.name || 'Someone';
    if (notif.type === 'MENTIONED') {
      return `${actorName} mentioned you: ${notif.body || ''}`;
    }
    if (notif.type === 'ASSIGNED') {
      return `${actorName} assigned the issue to you`;
    }
    if (notif.type === 'COMMENT_REPLY') {
      return `${actorName} replied: ${notif.body || ''}`;
    }
    if (notif.type === 'TASK_UPDATE') {
      return `${actorName} updated: ${notif.body || ''}`;
    }
    if (notif.type === 'WORKSPACE_INVITATION') {
      return `Invited you to join ${notif.workspace?.name || 'workspace'}`;
    }
    return notif.body || notif.title;
  };

  const selectedNotif = notifications.find((n) => n.id === selectedNotifId);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex-1 flex h-full w-full bg-[#090a0f] text-foreground overflow-hidden select-none',
        isResizing && 'cursor-col-resize',
      )}
    >
      {/* ------------------------------------------------------------- */}
      {/* LEFT PANE: INBOX NOTIFICATION LIST (Linear style)             */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{ width: `${listWidth}px` }}
        className={cn(
          'shrink-0 flex flex-col h-full bg-[#0b0c13] transition-[width] duration-75',
          isResizing && 'transition-none select-none',
          mobileShowDetail ? 'hidden md:flex' : 'flex w-full md:w-auto',
        )}
      >
        {/* Sleek Minimal Header */}
        <div className="h-10 px-3.5 border-b border-[#1a1b26] flex items-center justify-between gap-2 bg-[#0b0c13] shrink-0">
          <div className="flex items-center gap-2">
            {onOpenMobileNav && (
              <button
                onClick={onOpenMobileNav}
                className="p-1 rounded text-zinc-400 hover:text-white md:hidden hover:bg-[#161722]"
                title="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white tracking-tight">Inbox</span>
              <button className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors">
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-0.5 text-zinc-400">
            <button
              onClick={() => setFilter(filter === 'unread' ? 'all' : 'unread')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                filter === 'unread' ? 'text-indigo-400 bg-indigo-500/15' : 'hover:text-white hover:bg-[#161722]',
              )}
              title={filter === 'unread' ? 'Show all' : 'Filter unread only'}
            >
              <Mail className="w-3.5 h-3.5" />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1.5 rounded-md hover:text-white hover:bg-[#161722] transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className={cn(
                  'p-1.5 rounded-md hover:text-white hover:bg-[#161722] transition-colors',
                  filter !== 'all' && filter !== 'unread' && 'text-indigo-400 bg-indigo-500/15',
                )}
                title="Filter options"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {filterMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-[#141522] border border-[#232538] rounded-lg shadow-xl p-1 z-30 space-y-0.5 text-xs">
                  {(['all', 'unread', 'mentions', 'assigned'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setFilter(mode);
                        setFilterMenuOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-2 py-1 rounded capitalize transition-colors',
                        filter === mode ? 'bg-indigo-600/20 text-indigo-400 font-medium' : 'text-zinc-300 hover:bg-[#1c1d2e]',
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clean Items Feed */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#151622]/80">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-[11px]">Loading inbox...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-zinc-500">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                <Check className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-medium text-zinc-300">All caught up!</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Your inbox is clear.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isSelected = selectedNotifId === notif.id;
              const actorInitials = notif.actor?.name
                ? notif.actor.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'U';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleSelectNotification(notif)}
                  className={cn(
                    'group relative px-3 py-2.5 cursor-pointer transition-colors flex items-start gap-2.5 select-none',
                    isSelected
                      ? 'bg-[#151726] border-l-2 border-indigo-500'
                      : 'hover:bg-[#11121d] border-l-2 border-transparent',
                    !notif.isRead && !isSelected && 'bg-[#0d0e18]',
                  )}
                >
                  {/* Left: Avatar with badge */}
                  <div className="relative shrink-0 mt-0.5">
                    {notif.actor?.avatarUrl ? (
                      <img
                        src={resolveMediaUrl(notif.actor.avatarUrl)}
                        alt={notif.actor.name}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-[9px] flex items-center justify-center ring-1 ring-white/10">
                        {actorInitials}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5">
                      {renderNotificationBadge(notif.type)}
                    </div>
                  </div>

                  {/* Center: Issue Identifier & Title + Subtitle */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 truncate">
                      {notif.task?.identifier && (
                        <span className="font-mono text-[11px] font-medium text-zinc-400 shrink-0">
                          {notif.task.identifier}
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-xs truncate',
                          !notif.isRead ? 'text-white font-semibold' : 'text-zinc-300 font-normal',
                          isSelected && 'text-white font-medium',
                        )}
                      >
                        {notif.task?.title || notif.title}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {renderNotificationSnippet(notif)}
                    </p>
                  </div>

                  {/* Right: Status Icon + Timestamp */}
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {notif.task?.status && (
                      <StatusIcon status={notif.task.status} className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 ring-2 ring-[#0b0c13]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* HORIZONTAL RESIZE DIVIDER (Draggable between List and Detail) */}
      {/* ------------------------------------------------------------- */}
      <div
        onMouseDown={startResizing}
        className={cn(
          'hidden md:flex w-1 relative cursor-col-resize select-none shrink-0 transition-colors z-20 group items-center justify-center',
          isResizing ? 'bg-indigo-500' : 'bg-[#181926] hover:bg-indigo-500/50',
        )}
        title="Drag horizontally to resize inbox"
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize" />
        <div
          className={cn(
            'w-[1px] h-full transition-colors',
            isResizing ? 'bg-indigo-500' : 'bg-[#1e202f] group-hover:bg-indigo-500/80',
          )}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT PANE: SELECTED NOTIFICATION DETAIL & ACTIVITY           */}
      {/* ------------------------------------------------------------- */}
      <div
        className={cn(
          'flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden min-w-0',
          !mobileShowDetail ? 'hidden md:flex' : 'flex',
        )}
      >
        {!selectedNotif ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2 p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#12131d] border border-[#1e202f] flex items-center justify-center text-zinc-400">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs text-zinc-400">Select a notification to view conversation</p>
          </div>
        ) : selectedNotif.type === 'WORKSPACE_INVITATION' && selectedNotif.invitation ? (
          /* Workspace Invitation View */
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="h-10 px-4 border-b border-[#1a1b26] flex items-center justify-between bg-[#0b0c13]/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileShowDetail(false)}
                  className="p-1 rounded text-zinc-400 hover:text-white md:hidden"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-white">Workspace Invitation</span>
              </div>
            </div>

            <div className="p-8 max-w-md mx-auto w-full my-auto text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg">
                <Building2 className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-white">
                  Join {selectedNotif.workspace?.name || 'Workspace'}
                </h2>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {selectedNotif.actor?.name || 'An administrator'} invited you to join the{' '}
                  <span className="text-indigo-400 font-medium">{selectedNotif.workspace?.name}</span>{' '}
                  workspace.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => handleAcceptInvite(selectedNotif)}
                  disabled={actionLoadingId === selectedNotif.id}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs h-8 px-4 flex items-center gap-1.5"
                >
                  {actionLoadingId === selectedNotif.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>Accept Invitation</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => handleDeclineInvite(selectedNotif)}
                  disabled={actionLoadingId === selectedNotif.id}
                  className="text-xs h-8 px-4 text-zinc-400 hover:text-white border border-[#232538]"
                >
                  <span>Decline</span>
                </Button>
              </div>
            </div>
          </div>
        ) : taskLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-xs">Loading issue...</span>
          </div>
        ) : selectedTask ? (
          /* Issue Detail & Discussion (Editable like detail page) */
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
            {/* Sleek Top Bar */}
            <div className="h-10 px-4 border-b border-[#1a1b26] flex items-center justify-between bg-[#0b0c13]/70 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setMobileShowDetail(false)}
                  className="p-1 rounded text-zinc-400 hover:text-white md:hidden"
                  title="Back to list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-xs font-medium text-zinc-400">
                    {selectedTask.identifier}
                  </span>
                  <span className="text-xs font-medium text-zinc-200 truncate max-w-sm">
                    {taskTitle || selectedTask.title}
                  </span>
                </div>

                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={cn(
                    'p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors',
                    isFavorite && 'text-amber-400 hover:text-amber-300',
                  )}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={cn('w-3.5 h-3.5', isFavorite && 'fill-amber-400')} />
                </button>

                <button className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right Top Bar Quick Actions */}
              <div className="flex items-center gap-1 text-zinc-400">
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-md hover:text-white hover:bg-[#161722] transition-colors"
                  title="Copy issue link"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={handleToggleSubscribe}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    isSubscribed ? 'text-indigo-400 hover:text-indigo-300' : 'hover:text-white hover:bg-[#161722]',
                  )}
                  title={isSubscribed ? 'Subscribed' : 'Subscribe'}
                >
                  {isSubscribed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => router.push(`/issue/${selectedTask.id}`)}
                  className="p-1.5 rounded-md hover:text-white hover:bg-[#161722] transition-colors"
                  title="Open full page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Split Content: Main Content + Minimal Properties Sidebar */}
            <div className="flex-1 flex overflow-hidden min-w-0">
              {/* Main Center Area: Title, Tags, Description, Sub-issues, Activity */}
              <div className="flex-1 overflow-y-auto px-6 py-5 lg:px-8 space-y-5 max-w-3xl min-w-0">
                {/* 1. Directly Editable Title */}
                <div className="space-y-1">
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    onBlur={() => {
                      if (taskTitle.trim() && taskTitle !== selectedTask.title) {
                        saveTaskUpdates({ title: taskTitle.trim() });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    placeholder="Issue title..."
                    className="w-full text-lg sm:text-xl font-semibold bg-transparent border-none outline-none focus:ring-0 p-0 text-white placeholder:text-zinc-600 transition-colors tracking-tight"
                    title="Click directly to edit title"
                  />
                </div>

                {/* 2. Tags / Labels Strip (Inline tag addition & removal) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-zinc-400 bg-[#161725] px-2 py-0.5 rounded border border-[#232538] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {selectedTask.project?.name || workspace?.name || 'Project'}
                  </span>

                  {/* Active Label Tags */}
                  {taskLabels.map((lbl) => (
                    <span
                      key={lbl}
                      className="group inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300 bg-[#151624] px-2 py-0.5 rounded border border-[#24263a] hover:border-zinc-600 transition-colors"
                    >
                      <Tag className="w-2.5 h-2.5 text-zinc-500" />
                      <span>{lbl}</span>
                      <button
                        onClick={() => handleToggleLabel(lbl)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors ml-0.5"
                        title="Remove tag"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}

                  {/* Add Label Popover */}
                  <div className="relative">
                    <button
                      onClick={() => setLabelPickerOpen(!labelPickerOpen)}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#161726] transition-colors"
                    >
                      <Plus className="w-3 h-3 text-zinc-500" />
                      <span>Add label</span>
                    </button>

                    {labelPickerOpen && (
                      <div className="absolute left-0 top-full mt-1 w-52 bg-[#141522] border border-[#232538] rounded-lg shadow-2xl p-2 z-40 space-y-1.5">
                        <input
                          type="text"
                          value={labelSearch}
                          onChange={(e) => setLabelSearch(e.target.value)}
                          placeholder="Search or add label..."
                          autoFocus
                          className="w-full bg-[#0b0c13] border border-[#232538] rounded px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        />

                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                          {filteredLabels.map((lbl) => {
                            const isSelected = taskLabels.includes(lbl);
                            return (
                              <button
                                key={lbl}
                                onClick={() => handleToggleLabel(lbl)}
                                className={cn(
                                  'w-full flex items-center justify-between px-2 py-1 rounded text-xs text-left transition-colors',
                                  isSelected ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'text-zinc-300 hover:bg-[#1c1d2e]',
                                )}
                              >
                                <span>{lbl}</span>
                                {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                              </button>
                            );
                          })}

                          {labelSearch.trim() &&
                            !filteredLabels.some(
                              (l) => l.toLowerCase() === labelSearch.trim().toLowerCase(),
                            ) && (
                              <button
                                onClick={() => handleCreateLabel(labelSearch)}
                                className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-left text-indigo-400 hover:bg-[#1c1d2e]"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Create "{labelSearch.trim()}"</span>
                              </button>
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Auto-save Status Indicator */}
                  {saveStatus === 'saving' && (
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 ml-auto">
                      <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-400" />
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 ml-auto">
                      <Check className="w-2.5 h-2.5" />
                      Saved
                    </span>
                  )}
                </div>

                {/* 3. Directly Editable Description with WYSIWYG / Markdown */}
                <div className="space-y-3 pt-1">
                  <LinearRichEditor
                    value={taskDesc}
                    onChange={(val) => setTaskDesc(val)}
                    onBlur={() => {
                      if (taskDesc !== (selectedTask.description || '')) {
                        saveTaskUpdates({ description: taskDesc });
                      }
                    }}
                    taskId={selectedTask.id}
                    members={workspace?.members}
                    placeholder="Add description, bullet points, context..."
                    className="min-h-[90px]"
                  />

                  {/* Attachments / Video Player */}
                  {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {selectedTask.attachments.map((att) => {
                        const isVideo =
                          att.mimeType?.startsWith('video/') || att.url?.match(/\.(mp4|webm|mov)$/i);
                        const isImage =
                          att.mimeType?.startsWith('image/') ||
                          att.url?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);

                        if (isVideo) {
                          return (
                            <div
                              key={att.id}
                              className="rounded-xl overflow-hidden border border-[#202234] bg-black"
                            >
                              <video
                                src={resolveMediaUrl(att.url)}
                                controls
                                className="w-full max-h-[360px] object-contain"
                              />
                            </div>
                          );
                        }

                        if (isImage) {
                          return (
                            <div
                              key={att.id}
                              className="rounded-xl overflow-hidden border border-[#202234]"
                            >
                              <img
                                src={resolveMediaUrl(att.url)}
                                alt={att.originalName}
                                className="w-full max-h-[360px] object-contain bg-black/40"
                              />
                            </div>
                          );
                        }

                        return (
                          <a
                            key={att.id}
                            href={resolveMediaUrl(att.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141522] border border-[#232538] text-xs text-zinc-300 hover:text-white"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{att.originalName}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Sub-issues Section (Interactive with inline creation) */}
                <div className="space-y-2 pt-2 border-t border-[#1a1b26]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                      Sub-issues{' '}
                      {selectedTask.subTasks && selectedTask.subTasks.length > 0
                        ? `(${selectedTask.subTasks.length})`
                        : ''}
                    </span>

                    {!addingSubIssue && (
                      <button
                        onClick={() => setAddingSubIssue(true)}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-3 h-3 text-zinc-500" />
                        <span>Add sub-issue</span>
                      </button>
                    )}
                  </div>

                  {selectedTask.subTasks && selectedTask.subTasks.length > 0 && (
                    <div className="space-y-1">
                      {selectedTask.subTasks.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => router.push(`/issue/${st.id}`)}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#11121d] border border-[#1e202f] hover:border-zinc-700 transition-colors text-xs cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <StatusIcon status={st.status} className="w-3.5 h-3.5" />
                            <span className="font-mono text-zinc-500 text-[11px]">
                              {st.identifier}
                            </span>
                            <span className="text-zinc-200 group-hover:text-white truncate">
                              {st.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}

                  {addingSubIssue && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={subIssueTitle}
                        onChange={(e) => setSubIssueTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateSubIssue();
                          if (e.key === 'Escape') setAddingSubIssue(false);
                        }}
                        placeholder="Sub-issue title (Press Enter to create)..."
                        autoFocus
                        className="flex-1 bg-[#11121d] border border-indigo-500/50 rounded-md px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                      <Button
                        size="sm"
                        disabled={creatingSubIssue || !subIssueTitle.trim()}
                        onClick={handleCreateSubIssue}
                        className="h-7 text-xs px-3 bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        {creatingSubIssue ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                      </Button>
                      <button
                        onClick={() => setAddingSubIssue(false)}
                        className="text-xs text-zinc-500 hover:text-zinc-300 px-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. Activity & Comments Section */}
                <div className="space-y-4 pt-4 border-t border-[#1a1b26]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">Activity</span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleToggleSubscribe}
                        className="text-zinc-400 hover:text-white text-[11px] font-medium transition-colors"
                      >
                        {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                      </button>

                      {selectedTask.subscribers && selectedTask.subscribers.length > 0 && (
                        <div className="flex items-center -space-x-1.5">
                          {selectedTask.subscribers.slice(0, 4).map((sub: any, i: number) => (
                            <div
                              key={sub.id || i}
                              className="w-5 h-5 rounded-full ring-2 ring-[#090a0f] bg-zinc-800 text-[9px] font-bold text-zinc-300 flex items-center justify-center overflow-hidden"
                              title={sub.user?.name}
                            >
                              {sub.user?.avatarUrl ? (
                                <img
                                  src={resolveMediaUrl(sub.user.avatarUrl)}
                                  alt={sub.user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                sub.user?.name?.[0] || 'U'
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* System Event Logs (GitHub style folding if > 3 items) */}
                  <div className="space-y-1.5 text-[11px] text-zinc-400">
                    {(!selectedTask.activities || selectedTask.activities.length === 0) && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span>
                          {selectedTask.creator?.name || 'Author'} created the issue •{' '}
                          {formatTimeAgo(selectedTask.createdAt)}
                        </span>
                      </div>
                    )}

                    {selectedTask.activities && selectedTask.activities.length > 0 && (() => {
                      const acts = selectedTask.activities;
                      const hasMoreThanThree = acts.length > 3;
                      const hiddenCount = acts.length - 3;

                      if (!hasMoreThanThree) {
                        return acts.map((act) => (
                          <div key={act.id} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <span>
                              {act.user?.name || 'Someone'} {act.details || act.type} •{' '}
                              {formatTimeAgo(act.createdAt)}
                            </span>
                          </div>
                        ));
                      }

                      if (!isActivitiesExpanded) {
                        const topTwo = acts.slice(0, 2);
                        const lastOne = acts[acts.length - 1];

                        return (
                          <>
                            {topTwo.map((act) => (
                              <div key={act.id} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span>
                                  {act.user?.name || 'Someone'} {act.details || act.type} •{' '}
                                  {formatTimeAgo(act.createdAt)}
                                </span>
                              </div>
                            ))}

                            {/* GitHub-style Diff/Timeline Expander Bar matching Image 2 */}
                            <button
                              type="button"
                              onClick={() => setIsActivitiesExpanded(true)}
                              className="w-full flex items-center h-7 rounded-md bg-[#0d1e38] hover:bg-[#12284c] border border-[#1d3b6e]/70 text-left transition-colors group overflow-hidden my-1 shadow-sm"
                              title="Click to expand hidden activities"
                            >
                              <div className="w-7 h-full bg-[#132c58] group-hover:bg-[#1a386f] border-r border-[#1d3b6e]/80 flex flex-col items-center justify-center text-[#58a6ff] shrink-0 transition-colors">
                                {/* Top dots */}
                                <svg className="w-2.5 h-0.5 text-[#58a6ff]/70" viewBox="0 0 12 3" fill="currentColor">
                                  <circle cx="2" cy="1.5" r="1.2" />
                                  <circle cx="6" cy="1.5" r="1.2" />
                                  <circle cx="10" cy="1.5" r="1.2" />
                                </svg>
                                {/* Down arrow */}
                                <svg className="w-2 h-2 text-[#58a6ff] my-0.5" viewBox="0 0 16 16" fill="currentColor">
                                  <path fillRule="evenodd" d="M8 12a.75.75 0 0 1-.53-.22l-4-4a.75.75 0 0 1 1.06-1.06L8 10.19l3.47-3.47a.75.75 0 1 1 1.06 1.06l-4 4A.75.75 0 0 1 8 12Z" />
                                </svg>
                                {/* Up arrow */}
                                <svg className="w-2 h-2 text-[#58a6ff] -mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                                  <path fillRule="evenodd" d="M8 4a.75.75 0 0 1 .53.22l4 4a.75.75 0 0 1-1.06 1.06L8 5.81 4.53 9.28a.75.75 0 0 1-1.06-1.06l4-4A.75.75 0 0 1 8 4Z" />
                                </svg>
                                {/* Bottom dots */}
                                <svg className="w-2.5 h-0.5 text-[#58a6ff]/70" viewBox="0 0 12 3" fill="currentColor">
                                  <circle cx="2" cy="1.5" r="1.2" />
                                  <circle cx="6" cy="1.5" r="1.2" />
                                  <circle cx="10" cy="1.5" r="1.2" />
                                </svg>
                              </div>

                              <div className="flex-1 px-2.5 font-mono text-[11px] flex items-center gap-1.5 text-[#79c0ff] group-hover:text-[#a5d6ff]">
                                <span className="text-[#58a6ff]/70 font-semibold">@@</span>
                                <span>{hiddenCount} older activities hidden</span>
                                <span className="text-[#58a6ff]/70 font-semibold">@@</span>
                                <span className="text-zinc-500 text-[10px] hidden sm:inline ml-1 font-sans">• Click to expand</span>
                              </div>
                            </button>

                            <div key={lastOne.id} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              <span>
                                {lastOne.user?.name || 'Someone'} {lastOne.details || lastOne.type} •{' '}
                                {formatTimeAgo(lastOne.createdAt)}
                              </span>
                            </div>
                          </>
                        );
                      }

                      return (
                        <>
                          {acts.map((act) => (
                            <div key={act.id} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              <span>
                                {act.user?.name || 'Someone'} {act.details || act.type} •{' '}
                                {formatTimeAgo(act.createdAt)}
                              </span>
                            </div>
                          ))}

                          {/* GitHub-style Collapse Bar */}
                          <button
                            type="button"
                            onClick={() => setIsActivitiesExpanded(false)}
                            className="w-full flex items-center h-7 rounded-md bg-[#0d1e38]/70 hover:bg-[#12284c] border border-[#1d3b6e]/50 text-left transition-colors group overflow-hidden mt-1 shadow-sm"
                            title="Click to fold activities"
                          >
                            <div className="w-7 h-full bg-[#132c58] group-hover:bg-[#1a386f] border-r border-[#1d3b6e]/80 flex items-center justify-center text-[#58a6ff] shrink-0 transition-colors">
                              <svg className="w-2.5 h-2.5 text-[#58a6ff]" viewBox="0 0 16 16" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a.75.75 0 0 1 .53.22l4 4a.75.75 0 0 1-1.06 1.06L8 5.81 4.53 9.28a.75.75 0 0 1-1.06-1.06l4-4A.75.75 0 0 1 8 4Z" />
                              </svg>
                            </div>
                            <div className="flex-1 px-2.5 font-mono text-[11px] flex items-center gap-1.5 text-[#79c0ff] group-hover:text-[#a5d6ff]">
                              <span className="text-[#58a6ff]/70 font-semibold">@@</span>
                              <span>Collapse {hiddenCount} activities</span>
                              <span className="text-[#58a6ff]/70 font-semibold">@@</span>
                              <span className="text-zinc-500 text-[10px] hidden sm:inline ml-1 font-sans">• Click to fold</span>
                            </div>
                          </button>
                        </>
                      );
                    })()}
                  </div>

                  {/* Comments Cards */}
                  <div className="space-y-2.5 pt-1">
                    {selectedTask.comments?.map((comment) => (
                      <div
                        key={comment.id}
                        className="group/card rounded-xl border border-[#202234] bg-[#11121d] p-3.5 space-y-2"
                      >
                        {/* Author Header */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {comment.user?.avatarUrl ? (
                              <img
                                src={resolveMediaUrl(comment.user.avatarUrl)}
                                alt={comment.user.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                                {comment.user?.name?.[0] || 'U'}
                              </div>
                            )}
                            <span className="font-semibold text-white">{comment.user?.name}</span>
                            <span className="text-zinc-500 text-[11px]">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>

                          {/* Comment Owner Controls (Edit & Delete) */}
                          {user?.id === comment.userId && (
                            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingCommentText(comment.content);
                                }}
                                className="p-1 rounded text-zinc-500 hover:text-white"
                                title="Edit comment"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 rounded text-zinc-500 hover:text-rose-400"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Comment Content / Edit Form */}
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2 pt-1">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              rows={2}
                              className="w-full bg-[#0b0c13] border border-[#232538] rounded-lg p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 resize-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingCommentId(null)}
                                className="text-xs h-6 px-2 text-zinc-400 hover:text-white"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                disabled={isUpdatingComment || !editingCommentText.trim()}
                                onClick={() => handleSaveEditComment(comment.id)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-6 px-2.5"
                              >
                                {isUpdatingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-200 leading-relaxed font-normal">
                            <MarkdownRenderer
                              content={comment.content}
                              membersList={workspace?.members}
                            />
                          </div>
                        )}

                        {/* Reactions & Reply Trigger */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {comment.reactions && comment.reactions.length > 0 && (
                              <button
                                onClick={() => handleToggleReaction(comment.id, '👍')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#181926] border border-[#24263a] text-xs text-zinc-300 hover:text-white"
                              >
                                <span>👍</span>
                                <span className="text-[11px] font-semibold text-zinc-400">
                                  {comment.reactions.length}
                                </span>
                              </button>
                            )}

                            <div className="relative">
                              <button
                                onClick={() =>
                                  setReactionPopoverCommentId(
                                    reactionPopoverCommentId === comment.id ? null : comment.id,
                                  )
                                }
                                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1b28] transition-colors"
                                title="Add reaction"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>

                              {reactionPopoverCommentId === comment.id && (
                                <div className="absolute left-0 bottom-full mb-1 p-1 bg-[#161726] border border-[#2a2c42] rounded-lg shadow-xl flex items-center gap-1 z-30">
                                  {['👍', '❤️', '🚀', '👀', '🎉'].map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(comment.id, emoji)}
                                      className="p-1 hover:bg-[#202235] rounded text-sm transition-transform hover:scale-110"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              setReplyingCommentId(replyingCommentId === comment.id ? null : comment.id)
                            }
                            className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                          >
                            Leave a reply...
                          </button>
                        </div>

                        {/* Nested Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="pl-3 border-l border-[#202234] space-y-2 pt-2">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="text-xs space-y-1">
                                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                                  <span className="font-semibold text-zinc-200">
                                    {reply.user?.name}
                                  </span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(reply.createdAt)}</span>
                                </div>
                                <div className="text-zinc-300">
                                  <MarkdownRenderer
                                    content={reply.content}
                                    membersList={workspace?.members}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Nested Reply Form */}
                        {replyingCommentId === comment.id && (
                          <div className="pt-2 pl-3 border-l border-[#202234] space-y-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Reply to ${comment.user?.name}...`}
                              rows={2}
                              className="w-full bg-[#0b0c13] border border-[#232538] rounded-lg p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 resize-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setReplyingCommentId(null)}
                                className="text-xs h-6 px-2 text-zinc-400 hover:text-white"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                disabled={submittingReply || !replyText.trim()}
                                onClick={() => handleAddReply(comment.id)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-6 px-2.5"
                              >
                                {submittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reply'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Comment Input Card (with @mention tagging) */}
                  <form
                    onSubmit={handleAddComment}
                    className="relative rounded-xl border border-[#232538] bg-[#11121d] p-3 focus-within:border-indigo-500/50 transition-all space-y-2"
                  >
                    {/* Mention Tagging Autocomplete Popover */}
                    {mentionQuery !== null && matchingMembers.length > 0 && (
                      <div className="absolute left-3 bottom-full mb-1 w-52 bg-[#141522] border border-[#2a2c42] rounded-lg shadow-2xl p-1 z-40 space-y-0.5">
                        <div className="px-2 py-0.5 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                          Mention member
                        </div>
                        {matchingMembers.map((m) => (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => handleSelectMention(m.user?.name || m.user?.email || 'user')}
                            className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left text-zinc-200 hover:bg-indigo-600/20 hover:text-white transition-colors"
                          >
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                              {m.user?.name?.[0] || 'U'}
                            </span>
                            <span className="truncate">{m.user?.name || m.user?.email}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <textarea
                      ref={commentTextareaRef}
                      value={commentText}
                      onChange={handleCommentTextChange}
                      placeholder="Leave a comment... (Type @ to mention team members)"
                      rows={2}
                      className="w-full bg-transparent border-0 p-0 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-0 resize-none"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-zinc-400">
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingFile}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1a1b28] transition-colors"
                          title="Attach file"
                        >
                          {isUploadingFile ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Paperclip className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                          commentText.trim()
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
                        )}
                        title="Send comment"
                      >
                        {submittingComment ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* RIGHT PROPERTIES SIDEBAR (Interactive flat property rows)     */}
              {/* ------------------------------------------------------------- */}
              <div className="w-56 lg:w-60 shrink-0 border-l border-[#1a1b26] p-4 space-y-4 bg-[#0b0c13]/50 overflow-y-auto text-xs hidden xl:block">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block px-1">
                  Properties
                </span>

                <div className="space-y-1">
                  {/* Status Row */}
                  <div className="relative">
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-[#141523] rounded-md transition-colors"
                    >
                      <span className="text-zinc-400 text-xs">Status</span>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={selectedTask.status} />
                        <span className="font-medium text-white text-xs">
                          {selectedTask.status.replace('_', ' ')}
                        </span>
                      </div>
                    </button>

                    {statusDropdownOpen && (
                      <div className="absolute top-full right-0 w-44 mt-1 bg-[#141522] border border-[#232538] rounded-lg shadow-xl p-1 z-30 space-y-0.5">
                        {(['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'] as TaskStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              onClick={() => {
                                setStatusDropdownOpen(false);
                                saveTaskUpdates({ status: st });
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-colors',
                                selectedTask.status === st
                                  ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                                  : 'text-zinc-300 hover:bg-[#1a1c2c]',
                              )}
                            >
                              <StatusIcon status={st} />
                              <span>{st.replace('_', ' ')}</span>
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {/* Priority Row */}
                  <div className="relative">
                    <button
                      onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                      className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-[#141523] rounded-md transition-colors"
                    >
                      <span className="text-zinc-400 text-xs">Priority</span>
                      <div className="flex items-center gap-1.5">
                        <PriorityIcon priority={selectedTask.priority || 'NO_PRIORITY'} />
                        <span className="text-zinc-200 text-xs">
                          {selectedTask.priority === 'NO_PRIORITY' ? '---' : selectedTask.priority}
                        </span>
                      </div>
                    </button>

                    {priorityDropdownOpen && (
                      <div className="absolute top-full right-0 w-40 mt-1 bg-[#141522] border border-[#232538] rounded-lg shadow-xl p-1 z-30 space-y-0.5">
                        {(['NO_PRIORITY', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'] as TaskPriority[]).map(
                          (pr) => (
                            <button
                              key={pr}
                              onClick={() => {
                                setPriorityDropdownOpen(false);
                                saveTaskUpdates({ priority: pr });
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-colors',
                                selectedTask.priority === pr
                                  ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                                  : 'text-zinc-300 hover:bg-[#1a1c2c]',
                              )}
                            >
                              <PriorityIcon priority={pr} />
                              <span>{pr.replace('_', ' ')}</span>
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {/* Assignee Row */}
                  <div className="relative">
                    <button
                      onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                      className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-[#141523] rounded-md transition-colors"
                    >
                      <span className="text-zinc-400 text-xs">Assignee</span>
                      <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                        {selectedTask.assignee ? (
                          <>
                            {selectedTask.assignee.avatarUrl ? (
                              <img
                                src={resolveMediaUrl(selectedTask.assignee.avatarUrl)}
                                alt={selectedTask.assignee.name}
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                                {selectedTask.assignee.name?.[0] || 'U'}
                              </div>
                            )}
                            <span className="text-white text-xs truncate">
                              {selectedTask.assignee.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-500 text-xs">Unassigned</span>
                        )}
                      </div>
                    </button>

                    {assigneeDropdownOpen && (
                      <div className="absolute top-full right-0 w-48 mt-1 bg-[#141522] border border-[#232538] rounded-lg shadow-xl p-1 z-30 max-h-48 overflow-y-auto space-y-0.5">
                        <button
                          onClick={() => {
                            setAssigneeDropdownOpen(false);
                            saveTaskUpdates({ assigneeId: null });
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:bg-[#1a1c2c] text-left"
                        >
                          <span>Unassign</span>
                        </button>
                        {workspace?.members?.map((m) => (
                          <button
                            key={m.userId}
                            onClick={() => {
                              setAssigneeDropdownOpen(false);
                              saveTaskUpdates({ assigneeId: m.userId });
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left truncate',
                              selectedTask.assigneeId === m.userId
                                ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                                : 'text-zinc-300 hover:bg-[#1a1c2c]',
                            )}
                          >
                            <span className="truncate">{m.user?.name || m.user?.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Project Row */}
                  <div className="flex items-center justify-between py-1.5 px-2 hover:bg-[#141523] rounded-md transition-colors">
                    <span className="text-zinc-400 text-xs">Project</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-zinc-200 text-xs">
                        {selectedTask.project?.name || workspace?.name || 'Project'}
                      </span>
                    </div>
                  </div>

                  {/* Labels Row */}
                  <div className="py-1.5 px-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-xs">Labels</span>
                      <button
                        onClick={() => setLabelPickerOpen(true)}
                        className="text-zinc-500 hover:text-white"
                        title="Add label"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {taskLabels.length > 0 ? (
                        taskLabels.map((l) => (
                          <span
                            key={l}
                            className="px-1.5 py-0.2 rounded text-[10px] bg-[#171827] text-zinc-300 border border-[#232538]"
                          >
                            {l}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500 text-[11px]">No labels</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <span className="text-xs">No issue found.</span>
          </div>
        )}
      </div>
    </div>
  );
}
